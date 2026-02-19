"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Toggle } from "@/components/ui/toggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        {children}
      </div>
    </section>
  );
}

export default function ComponentsShowcasePage() {
  const [progress, setProgress] = useState(66);
  const [openCollapsible, setOpenCollapsible] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "" },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl py-12 px-4 space-y-16">
        <header className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Components</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-bold tracking-tight">
            shadcn/ui component showcase
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Neutral theme, dark by default. All components in one place.
          </p>
        </header>

        <TooltipProvider>
          <div className="space-y-16">
            <Section title="Button" description="Variants and sizes">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button disabled>
                  <Loader2 className="animate-spin" />
                  Loading
                </Button>
                <Button onClick={() => toast.success("Toast from button!")}>
                  Trigger toast
                </Button>
              </div>
            </Section>

            <Section title="Card">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                    <CardDescription>Card description text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card content goes here.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Another card</CardTitle>
                    <CardDescription>With badges</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Badge>Badge</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </CardContent>
                  <CardFooter />
                </Card>
              </div>
            </Section>

            <Section title="Form inputs">
              <div className="grid gap-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Label</Label>
                  <Input id="demo-input" placeholder="Input placeholder" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-textarea">Textarea</Label>
                  <Textarea
                    id="demo-textarea"
                    placeholder="Textarea placeholder"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="demo-checkbox" />
                  <Label htmlFor="demo-checkbox">Checkbox</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="demo-switch" />
                  <Label htmlFor="demo-switch">Switch</Label>
                </div>
                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick one" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Option A</SelectItem>
                      <SelectItem value="b">Option B</SelectItem>
                      <SelectItem value="c">Option C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Radio group</Label>
                  <RadioGroup defaultValue="one" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one" id="r1" />
                      <Label htmlFor="r1">One</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="two" id="r2" />
                      <Label htmlFor="r2">Two</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Slider (value: {progress})</Label>
                  <Slider
                    value={[progress]}
                    onValueChange={([v]) => setProgress(v ?? 0)}
                    max={100}
                  />
                </div>
              </div>
            </Section>

            <Section title="Form with validation (react-hook-form + zod)">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => toast.success(JSON.stringify(data)))}
                  className="max-w-md space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormDescription>At least 2 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </Section>

            <Section title="Tabs">
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="pt-4">
                  Content for tab 1.
                </TabsContent>
                <TabsContent value="tab2" className="pt-4">
                  Content for tab 2.
                </TabsContent>
                <TabsContent value="tab3" className="pt-4">
                  Content for tab 3.
                </TabsContent>
              </Tabs>
            </Section>

            <Section title="Accordion">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1">
                  <AccordionTrigger>Accordion item 1</AccordionTrigger>
                  <AccordionContent>
                    Content for the first accordion item.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                  <AccordionTrigger>Accordion item 2</AccordionTrigger>
                  <AccordionContent>
                    Content for the second accordion item.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Section>

            <Section title="Collapsible">
              <Collapsible open={openCollapsible} onOpenChange={setOpenCollapsible}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    {openCollapsible ? "Close" : "Open"} collapsible
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <p className="text-muted-foreground text-sm">
                    This content is shown when the collapsible is open.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </Section>

            <Section title="Alert">
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Default alert</AlertTitle>
                  <AlertDescription>
                    This is a default alert with title and description.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Destructive</AlertTitle>
                  <AlertDescription>
                    This alert uses the destructive variant.
                  </AlertDescription>
                </Alert>
              </div>
            </Section>

            <Section title="Dialog">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog title</DialogTitle>
                    <DialogDescription>
                      Dialog description text. You can put any content here.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Section>

            <Section title="Alert dialog">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Section>

            <Section title="Sheet">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Open sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Sheet title</SheetTitle>
                    <SheetDescription>
                      Sheet description. Slides in from the side.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 text-muted-foreground text-sm">
                    Sheet content area.
                  </div>
                </SheetContent>
              </Sheet>
            </Section>

            <Section title="Dropdown menu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Section>

            <Section title="Popover">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Popover title</h4>
                    <p className="text-sm text-muted-foreground">
                      Popover content appears when the trigger is clicked.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </Section>

            <Section title="Tooltip">
              <div className="flex gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tooltip content</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send email</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Section>

            <Section title="Hover card">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link">@hovercard</Button>
                </HoverCardTrigger>
                <HoverCardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Hover card</h4>
                    <p className="text-sm text-muted-foreground">
                      Shown on hover. Good for profile previews.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </Section>

            <Section title="Toggle & Toggle group">
              <div className="flex flex-wrap gap-3">
                <Toggle>Toggle</Toggle>
                <Toggle variant="outline" size="sm">
                  Small outline
                </Toggle>
                <ToggleGroup type="single">
                  <ToggleGroupItem value="a">A</ToggleGroupItem>
                  <ToggleGroupItem value="b">B</ToggleGroupItem>
                  <ToggleGroupItem value="c">C</ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup type="multiple">
                  <ToggleGroupItem value="1">1</ToggleGroupItem>
                  <ToggleGroupItem value="2">2</ToggleGroupItem>
                  <ToggleGroupItem value="3">3</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </Section>

            <Section title="Context menu">
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    Right-click here
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Back</ContextMenuItem>
                  <ContextMenuItem>Forward</ContextMenuItem>
                  <ContextMenuItem>Reload</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </Section>

            <Section title="Skeleton & Progress">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Label>Progress</Label>
                  <Progress value={progress} />
                </div>
              </div>
            </Section>

            <Section title="Table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Alice</TableCell>
                    <TableCell><Badge>Active</Badge></TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bob</TableCell>
                    <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Section>

            <Section title="Avatar">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>EF</AvatarFallback>
                </Avatar>
              </div>
            </Section>

            <Section title="Scroll area">
              <ScrollArea className="h-32 w-64 rounded-md border p-4">
                <p className="text-sm text-muted-foreground">
                  Scroll area content. Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                  et dolore magna aliqua. Ut enim ad minim veniam.
                </p>
              </ScrollArea>
            </Section>

            <Section title="Pagination">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </Section>

            <Section title="Calendar">
              <Calendar mode="single" className="rounded-md border" />
            </Section>

            <Section title="Command (combobox)">
              <Command className="rounded-lg border">
                <CommandInput placeholder="Type a command..." />
                <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>Calendar</CommandItem>
                    <CommandItem>Search</CommandItem>
                    <CommandItem>Settings</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </Section>

            <Section title="Separator">
              <div className="space-y-2">
                <p>Content above</p>
                <Separator />
                <p>Content below</p>
              </div>
            </Section>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
