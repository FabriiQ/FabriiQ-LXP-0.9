## Badge Component

The Badge component is used to highlight and categorize items with small colored indicators.

### Usage

```tsx
import { Badge } from '@/components/ui';

export default function Example() {
  return (
    <div className="space-x-2">
      <Badge>Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="purple">Purple</Badge>
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | The content to display inside the badge |
| `variant` | `BadgeVariant` | `'default'` | The visual style of the badge |
| `className` | `string` | `undefined` | Additional CSS classes to apply |

### Variants

The Badge component supports the following variants:
- `default`: Gray background with dark gray text
- `primary`: Light primary color background with primary text
- `secondary`: Light secondary color background with secondary text
- `accent`: Light accent color background with accent text
- `info`: Light blue background with blue text
- `success`: Light green background with green text
- `warning`: Light yellow background with yellow text
- `destructive`: Light red background with red text
- `outline`: White background with border and dark text
- `purple`: Light purple background with purple text 