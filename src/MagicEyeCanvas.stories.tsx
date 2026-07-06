import type { Meta, StoryObj } from "@storybook/react-vite";
import { MagicEyeCanvas } from "./MagicEyeCanvas";

const pattern = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPSczJyBmaWxsPScjMWQ0ZWQ4Jy8+PC9zdmc+";
const depth = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48Y2lyY2xlIGN4PScxMScgY3k9JzknIHI9JzYnIGZpbGw9JyNmZmYnLz48L3N2Zz4=";

const meta: Meta<typeof MagicEyeCanvas> = {
  title: "MagicEye/MagicEyeCanvas",
  component: MagicEyeCanvas,
  args: {
    pattern,
    depth,
    width: 1024,
    height: 768,
  },
};

export default meta;

type Story = StoryObj<typeof MagicEyeCanvas>;

export const Default: Story = {
  render: (args) => <MagicEyeCanvas {...args} />,
};
