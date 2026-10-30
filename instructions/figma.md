# Figma and design tokens

Read the project's design links, file key, current page inventory, token pipeline,
and documented exceptions before a design task. Keep these project facts out of
the shared package.

## Access and completion

- Discover the tools actually available in the active client. The client adapter
  explains connection/configuration; never assume a Claude tool namespace exists
  in another client.
- The community `figma-developer-mcp` server provides read/export capabilities,
  such as `get_figma_data` and `download_figma_images`. Read access does not imply
  the ability to write.
- Use a connected integration that explicitly supports the requested write, and
  read its applicable skill/instructions before calling it. A mockup-edit task is
  complete when the change is applied and verified in Figma.
- If a required capability is missing, state the missing capability and the
  concrete connection step. Do not replace an authorized Figma edit with a local
  image and call the task complete. Connection timing and reauthorization depend
  on the client; do not promise that tools appear on a particular turn.

## Tokens and components

**Build on the file's own tokens, never on loose values.** Whatever a node can take
from the file's variables and styles — colour, text style, radius, spacing — must be **bound**
to one, when creating it and when editing it. Missing from the palette? **Create the style or
variable and bind to that** — never leave a hand-set value behind, and never work around the gap
with an approximation. A loose value is invisible twice over: the Design Tokens export ships only
styles and variables, so unbound typography and colour never reach `tokens.json`, and the code
that needs them hardcodes a literal or fakes a `copyWith` — with nothing to show the palette is
short. Two consequences worth knowing:

- **Fix the master, not the instances.** Instances without an override of their own inherit it,
  so one edit on the component carries the whole file. Overriding instance by instance is how a
  master silently falls behind the screens built from it.
- **Scaled copies are the exception.** A frame exported at a non-1× scale (store screenshots, a
  shrunken preview) carries fractional sizes on purpose; binding a style there resets them and
  breaks the export. Leave them, and say why. The same goes for typography that is deliberately
  not yours — a vendor's own badge or lockup: give it its own group rather than bending an app
  style to fit.

**A master edit is not finished until its instances are checked.** Editing a component — a size,
a padding, a variant renamed, a variant added — can silently drop overrides in the screens built
from it: the title an instance had set falls back to the master's placeholder, a hidden slot
reappears, a swapped icon reverts. Figma reports none of it, and a screen three sections away is
where you find out. So after every write to a master, **walk its instances and verify each still
shows what it showed before** — don't stop at the one screen you were working on. Two things make
this concrete:

- **A cloned variant loses its `componentPropertyReferences`.** `clone()` copies the layers but
  not their wiring to the set's text / boolean / instance-swap properties, so every instance of
  the new variant keeps the correct property *value* while rendering the master's placeholder.
  After cloning a variant, restore the references on each child, comparing against the variant
  you cloned from.
- **Check the values, not the pixels.** For every instance, compare its `componentProperties`
  against what the node actually renders (the text a `TEXT` child holds, whether a referenced
  layer is visible). A one-pass sweep over the page catches the whole blast radius; a screenshot
  of the screen you happened to edit does not.

Overrides that are already lost cannot be recovered from the file — reconstruct them from the
code or the strings the screen uses, and say which ones you had to restore.

Raster exports for the asset densities: see Layers → *Assets* → *Raster densities*.
