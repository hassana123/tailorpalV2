// components/shop-setup/ShopReview.tsx
import { Card, CardContent } from '@/components/ui/card'
//import { Badge } from '@/components/ui/badge'
import { MapPin, Mail, Phone } from 'lucide-react'

export function ShopReview({ formData }: { formData: any }) {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="relative h-48 rounded-3xl overflow-hidden shadow-brand">
        <img 
          src={formData.bannerUrl || 'https://via.placeholder.com/1200x400'} 
          className="w-full h-full object-cover" 
          alt="Banner" 
        />
        <div className="absolute -bottom-6 left-8 p-1 bg-white rounded-2xl shadow-lg">
          <img 
            src={formData.logoUrl || 'https://via.placeholder.com/150'} 
            className="w-24 h-24 rounded-xl object-cover" 
            alt="Logo" 
          />
        </div>
      </div>

      <div className="pt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-4xl font-display text-brand-ink">{formData.name}</h2>
          <p className="text-brand-charcoal leading-relaxed">{formData.description || "No description provided."}</p>
        </div>
        
        <Card className="bg-brand-cream border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-brand-gold">Contact Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-brand-charcoal">
                <Mail className="h-4 w-4 text-brand-stone" /> {formData.email}
              </div>
              <div className="flex items-center gap-3 text-brand-charcoal">
                <Phone className="h-4 w-4 text-brand-stone" /> {formData.phone || 'N/A'}
              </div>
              <div className="flex items-start gap-3 text-brand-charcoal">
                <MapPin className="h-4 w-4 text-brand-stone mt-1" /> {formData.address}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}