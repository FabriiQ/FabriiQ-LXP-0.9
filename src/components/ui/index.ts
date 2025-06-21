/**
 * UI Components Library
 *
 * This file exports all UI components from the library.
 * Components are organized by category: core, extended, composite, and specialized.
 */

// Core Components
// These are direct implementations of shadcn/ui components with minimal modifications
export { Button, buttonVariants } from './core/button';
export { Input } from './core/input';
export {
  Card,
  Card as CoreCard,
  CardHeader,
  CardHeader as CoreCardHeader,
  CardTitle,
  CardTitle as CoreCardTitle,
  CardDescription,
  CardDescription as CoreCardDescription,
  CardContent,
  CardContent as CoreCardContent,
  CardFooter,
  CardFooter as CoreCardFooter
} from './core/card';
export {
  Select as CoreSelect,
  SelectGroup as CoreSelectGroup,
  SelectValue as CoreSelectValue,
  SelectTrigger as CoreSelectTrigger,
  SelectContent as CoreSelectContent,
  SelectLabel as CoreSelectLabel,
  SelectItem as CoreSelectItem,
  SelectSeparator as CoreSelectSeparator,
} from './core/select';

// Extended Components
// These are extended versions of core components with additional features
export {
  ExtendedButton,
  Button as ExtButton,
  extendedButtonVariants
} from './extended/button';
export {
  ExtendedInput,
  Input as ExtInput
} from './extended/input';
export {
  ExtendedCard,
  ExtendedCardHeader,
  ExtendedCardTitle,
  ExtendedCardDescription,
  ExtendedCardContent,
  ExtendedCardFooter,
  SimpleCard
} from './extended/card';
export {
  ExtendedSelect
} from './extended/select';

// Composite Components
// These are composite components built from core and extended components
export { FormField as CompositeFormField } from './composite/form-field';
export { DataCard as CompositeDataCard, DataCardGrid } from './composite/data-card';
export type { DataItem } from './composite/data-card';
export { SearchBar as CompositeSearchBar } from './composite/search-bar';
export { Pagination as CompositePagination } from './composite/pagination';
export { MobileNav } from './composite/mobile-nav';
export type { MobileNavItem } from './composite/mobile-nav';

// Specialized Components
// These are domain-specific components built on top of core, extended, and composite components

// Analytics Components
export { BarChart as NivoBarChart } from './specialized/analytics/bar-chart';
export { LineChart as NivoLineChart } from './specialized/analytics/line-chart';
export { PieChart as NivoPieChart } from './specialized/analytics/pie-chart';

// Dashboard Components
export { StatCard } from './specialized/dashboard/stat-card';
export { ActivityFeed } from './specialized/dashboard/activity-feed';
export type { ActivityItem } from './specialized/dashboard/activity-feed';
export {
  DashboardLayout,
  DashboardSection,
  DashboardGrid
} from './specialized/dashboard/dashboard-layout';

// Role-Based Components
export { SystemAdminShell } from './specialized/role-based/system-admin-shell';
export { TeacherShell } from './specialized/role-based/teacher-shell';
export { StudentShell } from './specialized/role-based/student-shell';

// Re-export design tokens and hooks
export { designTokens } from '@/styles/design-tokens';
export { useRoleTheme } from '@/hooks/use-role-theme';
export type { UserRole } from '@/hooks/use-role-theme';

// Backward compatibility exports
// Atoms
export { Button as LegacyButton } from './atoms/button';
export { Badge } from './atoms/badge';
export { Calendar } from './atoms/calendar';
export { Card as LegacyCard } from './atoms/card';
export { Card as CustomCard } from './atoms/custom-card';
export { Input as LegacyInput } from './atoms/input';
export { Label } from './atoms/label';
export { PageHeader } from './atoms/page-header';
export { Separator } from './atoms/separator';
export { Spinner } from './atoms/spinner';
export { Switch } from './atoms/switch';

// Molecules
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './molecules/form';
export { FormField as MoleculeFormField } from './molecules/form-field';

// Toast exports from feedback
export { useToast, toast, ToastProvider } from './feedback/toast';

// Organisms
export { ForgotPasswordForm } from './organisms/forgot-password-form';
export { LoginForm } from './organisms/login-form';
export { RegisterForm } from './organisms/register-form';
export { ResetPasswordForm } from './organisms/reset-password-form';

// Navigation
export { Breadcrumbs } from './navigation/breadcrumbs';
export { Pagination } from './navigation/pagination';
export { Sidebar } from './navigation/sidebar';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from './navigation/tabs';

// Forms
export { Calendar as FormCalendar } from './forms/calendar';
export { Checkbox } from './forms/checkbox';
export { DatePicker } from './forms/date-picker';
export { FileUpload } from './forms/file-upload';
export { Form as FormComponent, FormControl as FormComponentControl, FormDescription as FormComponentDescription, FormField as FormComponentField, FormItem as FormComponentItem, FormLabel as FormComponentLabel, FormMessage as FormComponentMessage } from './forms/form';
export { FormField as FormComponentFormField } from './forms/form-field';
export { RadioGroup } from './forms/radio';
export {
  Select as FormsSelect,
  SelectContent as FormsSelectContent,
  SelectGroup as FormsSelectGroup,
  SelectItem as FormsSelectItem,
  SelectLabel as FormsSelectLabel,
  SelectSeparator as FormsSelectSeparator,
  SelectTrigger as FormsSelectTrigger,
  SelectValue as FormsSelectValue
} from './forms/select';

// Export core components as default for new code
export { Textarea } from './forms/textarea';

// Feedback
export { Alert, AlertDescription, AlertTitle } from './feedback/alert';
export { Modal, useModal, ModalProvider } from './feedback/modal';

// Data Display
export { Accordion } from './data-display/accordion';
export type { AccordionItem, AccordionProps } from './data-display/accordion';
export {
  Card as DisplayCard,
  CardContent as DisplayCardContent,
  CardDescription as DisplayCardDescription,
  CardFooter as DisplayCardFooter,
  CardHeader as DisplayCardHeader,
  CardTitle as DisplayCardTitle
} from './data-display/card';
export { DataCard } from './data-display/data-card';
export { DataTable } from './data-display/data-table';

// Charts
export { BarChart as ReactBarChart } from './charts/BarChart';
export { LineChart as ReactLineChart } from './charts/LineChart';
export { PieChart as ReactPieChart } from './charts/PieChart';

// Root level components
export { Card as CardComponent } from './card-component';
export { Checkbox as RootCheckbox } from './checkbox';
export { Input as RootInput } from './input';
export { Logo } from './logo';
export { ScrollArea, ScrollBar } from './scroll-area';
export { SearchBar } from './search-bar';
export { ViewTransitionLink } from './view-transition-link';
export { ViewTransitionTest } from './view-transition-test';
export { PageTransitionWrapper } from './page-transition-wrapper';
export { ViewTransitionProvider } from './view-transition-provider';
