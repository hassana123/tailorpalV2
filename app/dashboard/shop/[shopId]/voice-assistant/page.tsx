'use client'

import { useParams } from 'next/navigation'
import { VoiceAssistant } from '@/components/voice-assistant'

export default function VoiceAssistantPage() {
  const params = useParams()
  const shopId = params.shopId as string

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Voice Assistant</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Run your entire shop hands-free. Enable <strong>Continuous listening</strong> and{' '}
            <strong>Auto-send</strong> for the best experience — just speak naturally and pause when done.
          </p>
        </div>

        <VoiceAssistant shopId={shopId} />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommandCard
            title="Add a customer"
            example='"Add customer Jane Doe phone 08012345678"'
            description="Creates a new customer record"
          />
          <CommandCard
            title="Record measurements"
            example='"Record measurements for Jane Doe chest 90 waist 70 hip 95"'
            description="Saves body measurements for a customer"
          />
          <CommandCard
            title="Create an order"
            example='"Create order for Jane Doe for evening gown due 2026-04-01"'
            description="Creates a new tailoring order"
          />
          <CommandCard
            title="Update order status"
            example='"Update order ORD-123 status to completed"'
            description="Changes the status of an existing order"
          />
          <CommandCard
            title="List customers"
            example='"List customers" or "Show customers"'
            description="Shows your recent customers"
          />
          <CommandCard
            title="Find a customer"
            example='"Find customer Jane"'
            description="Searches for a customer by name"
          />
          <CommandCard
            title="List orders"
            example='"List orders" or "Show pending orders"'
            description="Shows recent or pending orders"
          />
          <CommandCard
            title="Shop statistics"
            example='"Show shop statistics" or "Shop summary"'
            description="Overview of customers, orders and measurements"
          />
        </div>
      </div>
    </div>
  )
}

function CommandCard({
  title,
  example,
  description,
}: {
  title: string
  example: string
  description: string
}) {
  return (
    <div className="p-4 bg-muted/50 border rounded-xl">
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-sm font-mono text-primary bg-primary/5 rounded px-2 py-1 mb-2">{example}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
