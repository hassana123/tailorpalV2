// app/shop-setup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

// Sub-components
import { ImageUploadField } from "@/components/dashboard/shop/setup/ImageUploadFeild";
import { ShopReview } from "@/components/dashboard/shop/setup/ShopReview";
import { LocationHierarchyFields } from "@/components/location/LocationHierarchyFields";
import {
  LocationAutocomplete,
  type LocationSuggestion,
} from "@/components/location/LocationAutocomplete";
import { uploadShopMedia } from "@/lib/utils/shop-media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ShopSetupPage() {
  const [step, setStep] = useState(1);
  const [supabase] = useState(() => createClient());
  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Logic handlers kept intact
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (
    file: File,
    target: "logoUrl" | "bannerUrl",
  ) => {
    const setUploading =
      target === "logoUrl" ? setLogoUploading : setBannerUploading;
    try {
      setUploading(true);
      const publicUrl = await uploadShopMedia(
        supabase,
        file,
        target === "logoUrl" ? "logos" : "banners",
      );
      setFormData((prev) => ({ ...prev, [target]: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: suggestion.displayName,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to create shop");
      const { shop } = await response.json();
      toast.success("Your fashion empire starts now!");
      router.push(`/dashboard/shop/${shop.id}`);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream noise-overlay flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-6xl space-y-5">
        {/* Progress Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <span className="bg-brand-gold/10 text-brand-gold border-brand-gold/20 hover:bg-brand-gold/10 px-6 py-2 rounded-md">
            Step {step} of 3
          </span>
          <h1 className="text-2xl font-display text-brand-ink">
            {step === 1 && "The Basics"}
            {step === 2 && "Visual Identity"}
            {step === 3 && "Review & Launch"}
          </h1>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-card border border-brand-border/50">
          {/* STEP 1: TEXT DETAILS */}
          {step === 1 && (
            <div className="grid gap-8 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Atelier V"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="hello@atelier.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-brand-ink font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="h-12 border-brand-border focus:ring-brand-gold"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <LocationHierarchyFields
                  country={formData.country}
                  state={formData.state}
                  city={formData.city}
                  onCountryChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      country: v,
                      state: "",
                      city: "",
                      address: "",
                    }))
                  }
                  onStateChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      state: v,
                      city: "",
                      address: "",
                    }))
                  }
                  onCityChange={(v) =>
                    setFormData((p) => ({ ...p, city: v, address: "" }))
                  }
                />
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <LocationAutocomplete
                    value={formData.address}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, address: v }))
                    }
                    onSelect={handleLocationSelect}
                    country={formData.country}
                    state={formData.state}
                    city={formData.city}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VISUALS */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid md:grid-cols-3 gap-8 items-start">
                <ImageUploadField
                  label="Shop Logo"
                  value={formData.logoUrl}
                  isUploading={logoUploading}
                  onUpload={(file) => handleImageUpload(file, "logoUrl")}
                  description="Recommended 500x500px"
                />
                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Banner Image"
                    value={formData.bannerUrl}
                    aspectRatio="video"
                    isUploading={bannerUploading}
                    onUpload={(file) => handleImageUpload(file, "bannerUrl")}
                    description="This will appear at the top of your shop profile"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Shop Story</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your aesthetic..."
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && <ShopReview formData={formData} />}

          {/* NAVIGATION BUTTONS */}
          <div className="mt-12 pt-8 border-t border-brand-border flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="text-brand-stone hover:text-brand-ink"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="bg-brand-ink hover:bg-brand-charcoal text-white px-8 rounded-full h-12"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-brand-gold hover:opacity-90 text-white px-10 rounded-full h-12 shadow-gold animate-pulse-glow"
              >
                {isLoading ? "Creating..." : "Confirm & Launch"}{" "}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
