## MODIFIED Requirements

### Requirement: CMS speech thumbnail section

The CMS speech detail page SHALL include a **Thumbnail** card showing `thumbnailProcessStatus`, an image preview when `thumbnailProcessStatus` is `finished` and a thumbnail URL is available, and `thumbnailErrorMessage` when `failed`. While `thumbnailProcessStatus` is `pending` or `processing`, the card SHALL show a generating state and poll `speeches.getById` until status becomes `finished` or `failed`. When publication `status` is not `published`, the card SHALL offer **Regenerate thumbnail** opening a confirmation dialog. The dialog SHALL include an optional **Extra prompt** field (textarea) for author direction on the new cover image. Confirming **Regenerate thumbnail** SHALL call `speeches.regenerateThumbnail` with the speech `id` and the trimmed extra prompt when non-empty, with loading/disabled state while in flight. When publication `status` is `published`, **Regenerate thumbnail** SHALL NOT be shown.

#### Scenario: Thumbnail preview when finished

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `finished`
- **THEN** the Thumbnail card displays the cover image preview

#### Scenario: Thumbnail generating state polls

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `processing`
- **THEN** a generating indicator is shown and the client refreshes until status becomes `finished` or `failed`

#### Scenario: Manual regenerate thumbnail

- **WHEN** user confirms **Regenerate thumbnail** on an unpublished speech without entering an extra prompt
- **THEN** `speeches.regenerateThumbnail` is invoked with the speech `id` only and the card returns to a generating state

#### Scenario: Manual regenerate thumbnail with extra prompt

- **WHEN** user enters text in **Extra prompt** and confirms **Regenerate thumbnail** on an unpublished speech
- **THEN** `speeches.regenerateThumbnail` is invoked with the speech `id` and trimmed extra prompt and the card returns to a generating state

#### Scenario: Thumbnail regenerate hidden while published

- **WHEN** user views a speech with publication `status` `published`
- **THEN** the Thumbnail card does not offer **Regenerate thumbnail**
