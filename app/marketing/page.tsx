"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

export default function MarketingPage() {
  const [product, setProduct] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const testApiConnection = async () => {
    try {
      const testRes = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "Test" }),
      });
      if (!testRes.ok) {
        const data = await testRes.json();
        throw new Error(data?.error || "API test failed");
      }
      setApiStatus("API is working correctly!");
    } catch (err: any) {
      setApiStatus("API connection failed. Please check your API key.");
      console.error("API Test Error:", err);
    }
  };

  const generate = async () => {
    if (!product.trim()) {
      setError("Please enter a product name");
      return;
    }
    
    // Check if the product is likely a food or farming product
    const foodKeywords = [
      'apple', 'orange', 'banana', 'mango', 'grape', 'berry', 'tomato',
      'cucumber', 'carrot', 'potato', 'onion', 'garlic', 'spinach',
      'lettuce', 'broccoli', 'milk', 'cheese', 'egg', 'meat', 'chicken',
      'beef', 'pork', 'fish', 'seafood', 'dairy', 'fruit', 'vegetable',
      'fresh', 'organic', 'food'
    ];

    const isFoodProduct = foodKeywords.some(keyword => 
      product.toLowerCase().includes(keyword)
    );

    if (!isFoodProduct) {
      setError("Error: This is not a food or farming product. Please enter a food item or farming product (e.g., fruits, vegetables, dairy, meat, etc.).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDescription(null);
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to generate description");
      }
      const data = await res.json();
      setDescription(data.marketingDescription);
      setError(null);
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(`Error generating description: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" /> Generate Marketing Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Enter product name e.g. Fresh Tomatoes"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={testApiConnection}>
              Test API
            </Button>
          </div>
          <Button disabled={isLoading} onClick={generate} className="w-full">
            {isLoading ? "Generating..." : "Generate"}
          </Button>
          {apiStatus && <p className="text-green-600 text-sm">{apiStatus}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Textarea readOnly value={description} className="h-32" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
