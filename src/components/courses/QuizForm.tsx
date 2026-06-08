
import React from 'react';
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

const quizSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    options: z.array(z.string().min(1, "Option is required")).length(4, "Exactly 4 options are required"),
    correct_answer: z.string().min(1, "Correct answer is required"),
  })),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuizFormProps {
  onSave: (data: QuizFormValues) => void;
  defaultValues?: Partial<QuizFormValues>;
  moduleIndex: number;
}

export function QuizForm({ onSave, defaultValues, moduleIndex }: QuizFormProps) {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      questions: defaultValues?.questions || [{ 
        question: "", 
        options: ["", "", "", ""], 
        correct_answer: "" 
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} data-quiz={moduleIndex} className="space-y-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quiz for Chapter {moduleIndex + 1}</h3>

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 mb-6 pb-6 border-b last:border-b-0 quiz-question">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Question {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`questions.${index}.question`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter question" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {[0, 1, 2, 3].map((optionIndex) => (
                <FormField
                  key={optionIndex}
                  control={form.control}
                  name={`questions.${index}.options.${optionIndex}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option {optionIndex + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder={`Enter option ${optionIndex + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name={`questions.${index}.correct_answer`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter correct answer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={() => append({ question: "", options: ["", "", "", ""], correct_answer: "" })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </Card>
      </form>
    </Form>
  );
}
