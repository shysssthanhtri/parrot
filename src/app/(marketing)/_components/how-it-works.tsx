import { Headphones, Mic, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse speeches",
    description:
      "Explore published speeches on topics you care about, curated for language learners.",
  },
  {
    icon: Headphones,
    title: "Listen and follow along",
    description:
      "Shadow native speakers sentence by sentence with synced text and audio.",
  },
  {
    icon: Mic,
    title: "Practice out loud",
    description:
      "Repeat aloud to build pronunciation, rhythm, and confidence in real speech.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-t py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Parrot uses language shadowing — listen, read, and speak along — to
            help you sound more natural.
          </p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col items-center text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full border bg-muted">
                <step.icon className="size-5" />
              </span>
              <span className="mt-4 text-sm font-medium text-muted-foreground">
                Step {index + 1}
              </span>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
