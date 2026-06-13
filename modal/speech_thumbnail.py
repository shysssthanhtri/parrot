"""Speech thumbnail API - SD 3.5 Medium Turbo cover art on Modal."""

import os

import modal

# Modal secrets: run the "Setup Modal Secrets" GitHub Action once (or when
# credentials rotate). It syncs GitHub secrets → Modal:
#   hf-token             (HF_TOKEN)
#   thumbnail-api-key    (THUMBNAIL_API_KEY)
#
# Local test (from repo root):
# modal run modal/speech_thumbnail.py \
#   --prompt "Abstract portrait cover art, warm tones, no text"
#
# curl -X POST "https://<your-modal-endpoint>/generate" \
#   -H "Content-Type: application/json" \
#   -H "X-Api-Key: <your-api-key>" \
#   -d '{"prompt": "Abstract portrait cover art, warm tones, no text"}' \
#   --output output.png

MODEL_ID = "tensorart/stable-diffusion-3.5-medium-turbo"
THUMBNAIL_WIDTH = 832
THUMBNAIL_HEIGHT = 1088
INFERENCE_STEPS = 4
GUIDANCE_SCALE = 0.0
WEBP_QUALITY = 85
CACHE_DIR = "/cache"

hf_cache_volume = modal.Volume.from_name("parrot-hf-cache", create_if_missing=True)

image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "accelerate==1.6.0",
    "diffusers==0.33.1",
    "fastapi[standard]==0.124.4",
    "pillow==11.1.0",
    "safetensors==0.5.3",
    "sentencepiece==0.2.0",
    "torch==2.6.0",
    "transformers==4.51.3",
)
app = modal.App("parrot-speech-thumbnail", image=image)

with image.imports():
    import io
    import os

    import torch
    from diffusers import StableDiffusion3Pipeline
    from fastapi import Depends, FastAPI, HTTPException, Security
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from fastapi.security import APIKeyHeader
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("THUMBNAIL_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class ThumbnailRequest(BaseModel):
        prompt: str = Field(..., min_length=1, max_length=5000)
        seed: int | None = Field(default=None, ge=0)


@app.cls(
    gpu="a10g",
    max_containers=1,
    scaledown_window=60 * 5,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("thumbnail-api-key"),
    ],
    volumes={CACHE_DIR: hf_cache_volume},
)
@modal.concurrent(max_inputs=1)
class ThumbnailInference:
    @modal.enter()
    def load_model(self):
        os.environ["HF_HOME"] = CACHE_DIR
        token = os.environ.get("HF_TOKEN")
        self.pipe = StableDiffusion3Pipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            token=token,
        )
        self.pipe = self.pipe.to("cuda")

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="Parrot Speech Thumbnail API",
            description="Cover art generation for speech catalog cards",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.post("/generate", responses={200: {"content": {"image/webp": {}}}})
        def generate_thumbnail(request: ThumbnailRequest):
            try:
                webp_bytes = self.generate.local(
                    request.prompt,
                    request.seed,
                )
                return StreamingResponse(
                    io.BytesIO(webp_bytes),
                    media_type="image/webp",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate thumbnail: {e}",
                )

        return web_app

    @modal.method()
    def generate(self, prompt: str, seed: int | None = None):
        generator = None
        if seed is not None:
            generator = torch.Generator(device="cuda").manual_seed(seed)

        result = self.pipe(
            prompt=prompt,
            width=THUMBNAIL_WIDTH,
            height=THUMBNAIL_HEIGHT,
            num_inference_steps=INFERENCE_STEPS,
            guidance_scale=GUIDANCE_SCALE,
            generator=generator,
        )
        image = result.images[0]

        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=WEBP_QUALITY)
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Abstract editorial cover art, soft gradients, no text or lettering.",
    seed: int | None = None,
    output_path: str = "/tmp/speech-thumbnail/output.webp",
):
    import pathlib

    inference = ThumbnailInference()
    webp_bytes = inference.generate.remote(prompt=prompt, seed=seed)

    output_file = pathlib.Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(webp_bytes)
    print(f"Thumbnail saved to {output_file}")
