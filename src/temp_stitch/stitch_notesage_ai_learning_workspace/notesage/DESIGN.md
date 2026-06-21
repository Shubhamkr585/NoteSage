---
name: NoteSage
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#8990a8'
  on-tertiary-container: '#22293d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is engineered for deep focus and cognitive clarity, positioned as a premium workspace for high-stakes learning. The brand personality is sophisticated, authoritative, and intellectually empowering. 

The aesthetic sits at the intersection of **Minimalism** and **Glassmorphism**. It borrows the rigorous functionalism of modern engineering tools while introducing "human" layers through soft translucency and vibrant spectral accents. The visual language emphasizes high-quality whitespace to reduce cognitive load, ensuring that the AI-generated insights remain the focal point of the user experience.

## Colors

The system uses a dual-mode strategy optimized for long-form reading and intense study sessions.

**Dark Mode (Primary):** The foundation is built on deep slate and charcoal neutrals (`#020617` to `#1E293B`). This provides a low-strain environment for evening study.
**Light Mode:** Built on a "Crisp White" palette (`#FFFFFF` to `#F8FAFC`) with subtle cool-grey borders.

**Brand Accents:** 
- **Vibrant Gradient:** A signature "Knowledge Flow" gradient shifting from Violet (`#8B5CF6`) to Blue (`#3B82F6`) is used for primary actions, progress indicators, and AI-state highlights.
- **Success/Warning/Error:** Utilize high-vibrancy tones that maintain legibility against both deep slate and pure white backgrounds.

## Typography

The typography system relies on a pairing of **Geist** for structural elements and **Inter** for long-form content. 

- **Geist** provides a technical, precise feel for headlines, navigation, and labels. Its slightly condensed nature works exceptionally well for density-heavy SaaS interfaces.
- **Inter** is reserved for the core learning experience: notes, AI summaries, and chat interfaces. It is tuned for maximum readability across all devices.
- **Optical Sizing:** Use tighter letter-spacing for Display and Headline styles to maintain a premium "editorial" feel.

## Layout & Spacing

The design system utilizes a **8px linear scale** for consistent rhythm. The layout philosophy is a **Hybrid Fluid Grid**.

- **Sidebar-Centric:** A fixed-width left navigation (240px-280px) that can be collapsed to a rail (64px) to maximize workspace.
- **Workspace:** A centered content column with a max-width of 800px for optimal reading line-length, flanked by dynamic AI "Context Panels."
- **Breakpoints:**
  - **Mobile (<768px):** Single column, bottom-sheet navigation for AI tools.
  - **Tablet (768px - 1024px):** Collapsed sidebar, 2-column layout for notes + AI assistant.
  - **Desktop (>1024px):** Full 3-panel layout (Nav | Content | AI Chat).

## Elevation & Depth

This design system uses **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows to create a sense of hierarchy.

- **Base Layer:** Deep slate/charcoal (Dark) or Crisp White (Light).
- **Surface Layer:** Subtle 1px borders using `white/10` (Dark) or `slate/200` (Light). This defines card boundaries without adding visual weight.
- **The Glass Effect:** Sidebars and floating AI command bars use a `backdrop-blur` (12px to 20px) with a semi-transparent surface fill (`slate-900/70` or `white/70`).
- **Elevated States:** Modals and context menus use a 1px "glow" border using the primary gradient at 20% opacity to signal AI-active states.

## Shapes

The shape language is controlled and modern. 

- **Standard Elements:** Buttons, inputs, and cards use a 0.5rem (8px) radius to maintain a professional balance between friendly and technical.
- **Interactive Triggers:** Small chips or status indicators utilize the "Pill" shape for distinct visual separation from data-entry fields.
- **Containers:** Large workspace panels and modals use 1rem (16px) corner radii to soften the overall structure of the software.

## Components

Components follow the **shadcn/ui** philosophy: unstyled accessibility logic with a highly customized, minimal visual layer.

- **Buttons:** Primary buttons use the brand gradient with white text. Secondary buttons are "ghost" style with subtle 1px borders that reveal a background tint on hover.
- **Input Fields:** Minimalist design with no background; only a bottom border that expands to a full outline when focused, utilizing a soft glow.
- **AI Chat Cards:** These use a distinct glass-morphic treatment with a slight blue/purple inner-shadow to differentiate machine-generated content from user notes.
- **Chips:** Used for "Topics" or "Sources." They should be low-contrast (slate-800 background in dark mode) to avoid distracting from the main text.
- **Knowledge Graph:** A custom component featuring node-and-link styling with ultra-thin lines and subtle "breathing" animations for active nodes.