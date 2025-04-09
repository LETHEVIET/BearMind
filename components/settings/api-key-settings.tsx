import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChatSettings } from "@/components/ChatSettingsContext";

// Define the form schema with Zod
const formSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function ApiKeySettings() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { apiKey, setApiKey } = useChatSettings();

    // Initialize form with React Hook Form and Zod validation
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            apiKey: "",
        },
    });

    // Load API key from context on component mount
    useEffect(() => {
        if (apiKey) {
            form.setValue("apiKey", apiKey);
        }
    }, [apiKey, form]);

    // Form submission handler
    const onSubmit = async (values: FormValues) => {
        try {
            setApiKey(values.apiKey);
            toast({
                title: "Success",
                description: "API key saved successfully",
                variant: "default",
            });
        } catch (error) {
            console.error("Error saving API key:", error);
            toast({
                title: "Error",
                description: "Failed to save API key",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Gemini API Key</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder={t('enterApiKey') || 'Enter your Gemini API key'}
                                        className="w-full text-xs"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Your API key is stored locally and never sent to any servers. Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={!form.formState.isDirty}>
                            Save API Key
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}