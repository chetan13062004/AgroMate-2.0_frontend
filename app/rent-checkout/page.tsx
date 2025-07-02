"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRentalCart } from "@/contexts/rental-cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function RentCheckoutPage() {
  const { items, clearCart } = useRentalCart(); // Removed 'as any' for better type safety
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const [details, setDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    fromDate: "",
    toDate: "",
    notes: "",
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // More standard handleChange for form elements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  
  // Memoized validation function to avoid re-running on every render unless details/items change
  const validateDetails = useMemo(() => () => {
    const e: { [k: string]: string } = {};
    
    if (!details.name.trim()) e.name = "Name is required";
    else if (details.name.trim().length < 2) e.name = "Name must be at least 2 characters";

    if (!details.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(details.phone.trim())) e.phone = "Please enter a valid 10-digit phone number";

    if (!details.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(details.email)) e.email = "Please enter a valid email address";

    if (!details.address.trim()) e.address = "Address is required";
    else if (details.address.trim().length < 10) e.address = "Address must be at least 10 characters";

    if (!details.fromDate) e.fromDate = "Start date is required";
    else if (details.fromDate < todayStr) e.fromDate = "Start date cannot be in the past";

    if (!details.toDate) e.toDate = "End date is required";
    else if (new Date(details.toDate) < new Date(details.fromDate || todayStr)) e.toDate = "End date must be after the start date";

    if (details.fromDate && details.toDate) {
        items.forEach((item: any) => {
          if (item.availabilityStartDate && new Date(details.fromDate) < new Date(item.availabilityStartDate)) {
            e.fromDate = `Start must be on/after ${new Date(item.availabilityStartDate).toLocaleDateString()}`;
          }
          if (item.availabilityEndDate && new Date(details.toDate) > new Date(item.availabilityEndDate)) {
            e.toDate = `End must be on/before ${new Date(item.availabilityEndDate).toLocaleDateString()}`;
          }
        });
    }

    return e;
  }, [details, items, todayStr]);

  const isFormValid = useMemo(() => Object.keys(validateDetails()).length === 0, [validateDetails]);

  const rentalDays = useMemo(() => {
    if (!details.fromDate || !details.toDate || new Date(details.toDate) < new Date(details.fromDate)) return 0;
    const diffTime = new Date(details.toDate).getTime() - new Date(details.fromDate).getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1); // +1 to include end date
  }, [details.fromDate, details.toDate]);

  const subtotal = useMemo(() => 
    items.reduce((sum: number, item: any) => sum + item.price * rentalDays, 0),
    [items, rentalDays]
  );
  
  const taxes = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  const availabilityWindow = useMemo(() => {
    if (items.length === 0) return null;
    const latestStart = new Date(Math.max(...items.map((i: any) => new Date(i.availabilityStartDate || 0).getTime())));
    const earliestEnd = new Date(Math.min(...items.map((i: any) => new Date(i.availabilityEndDate || '9999-12-31').getTime())));
    if (latestStart > earliestEnd) return { latestStart: new Date(0), earliestEnd: new Date(0), noOverlap: true };
    return { latestStart, earliestEnd };
  }, [items]);

  useEffect(() => {
    if (items.length === 0 && !processing) {
      router.replace("/rent-cart");
    }
  }, [items, processing, router]);
  
  const placeOrder = async () => {
    const id = `rent-${Date.now()}`;
    const order = {
      id,
      items,
      subtotal,
      taxes,
      total,
      renter: details,
      placedAt: new Date().toISOString()
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(`order-${id}`, JSON.stringify(order));
      const list = JSON.parse(localStorage.getItem("rentalOrderIds") || "[]");
      localStorage.setItem("rentalOrderIds", JSON.stringify([...list, id]));
    }
    clearCart();
    await Swal.fire({
      title: "Order Confirmed!",
      text: "Your rental order has been successfully placed.",
      icon: "success",
      confirmButtonText: "View My Rentals",
    });
    router.push("/rent-history");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDetails();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      setProcessing(true);
      await placeOrder();
    }
  };

  if (items.length === 0) {
    return null; // Redirects via useEffect
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold">Rental Checkout</h1>
      {availabilityWindow && !availabilityWindow.noOverlap && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          All items are available between <b>{availabilityWindow.latestStart.toLocaleDateString()}</b> and <b>{availabilityWindow.earliestEnd.toLocaleDateString()}</b>.
        </div>
      )}
       {availabilityWindow?.noOverlap && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          The items in your cart have no overlapping rental dates. Please adjust your cart.
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Details & Rental Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Enter your full name" value={details.name} onChange={handleChange} className={errors.name ? 'border-red-500' : ''} />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="10-digit mobile number" value={details.phone} onChange={handleChange} className={errors.phone ? 'border-red-500' : ''} />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="example@mail.com" value={details.email} onChange={handleChange} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea id="address" name="address" placeholder="Full address for delivery and pickup" value={details.address} onChange={handleChange} className={errors.address ? 'border-red-500' : ''} />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input id="fromDate" name="fromDate" type="date" min={todayStr} value={details.fromDate} onChange={handleChange} className={errors.fromDate ? 'border-red-500' : ''} />
                  {errors.fromDate && <p className="text-red-500 text-sm mt-1">{errors.fromDate}</p>}
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input id="toDate" name="toDate" type="date" min={details.fromDate || todayStr} value={details.toDate} onChange={handleChange} className={errors.toDate ? 'border-red-500' : ''} />
                  {errors.toDate && <p className="text-red-500 text-sm mt-1">{errors.toDate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                <h3 className="font-semibold mb-2">Rental Items ({items.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 text-sm">
                  {items.map((item: any) => (
                    <div key={item._id} className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-gray-500">₹{item.price.toLocaleString()}{rentalDays > 0 ? ` × ${rentalDays} days` : "/day"}</p>
                      </div>
                      <span className="font-medium whitespace-nowrap">₹{(item.price * rentalDays).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Taxes (5%)</span><span>₹{taxes.toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
              </div>
              <div className="mt-4">
                <Label className="mb-2 block">Payment Method</Label>
                <div className="flex items-center gap-2 p-3 rounded-md border bg-slate-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Cash on Delivery</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button type="submit" className="w-full" disabled={processing || !isFormValid || !!availabilityWindow?.noOverlap}>
                  {processing ? "Placing Order..." : `Place Order (COD)`}
                </Button>
                <Button asChild className="w-full" variant="outline" disabled={processing}>
                  <Link href="/rent-cart">Back to Cart</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}