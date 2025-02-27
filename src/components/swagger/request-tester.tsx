import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useRequestHistoryStore } from "@/stores/swagger/requestHistoryStore";
import { useToast } from "@/hooks/use-toast";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader, PlayCircle, Plus, Trash } from "lucide-react";

interface Parameter {
  in: string;
  name: string;
  required?: boolean;
  description?: string;
  schema?: {
    type: string;
  };
  default?: string;
}

interface RequestBodyContent {
  "application/json"?: {
    schema?: {
      type: string;
      properties?: Record<string, unknown>;
    };
    example?: unknown;
  };
}

interface RequestBody {
  content?: RequestBodyContent;
}

interface Server {
  url: string;
  description?: string;
}

interface RequestTesterProps {
  path: string;
  method: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  servers?: Server[];
}

interface ResponseData {
  [key: string]: unknown;
}

export default function RequestTester({
  path,
  method,
  parameters,
  requestBody,
  servers = [],
}: RequestTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<
    string,
    string
  > | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);

  const [customHeaders, setCustomHeaders] = useState<
    { key: string; value: string }[]
  >([{ key: "Content-Type", value: "application/json" }]);

  const { addHistoryItem } = useRequestHistoryStore();
  const { toast } = useToast();

  // 从parameters生成表单schema
  const formSchema = z.object({
    baseUrl: z.string().url("必须是有效的URL"),
    ...Object.fromEntries(
      parameters.map((param) => {
        if (param.required) {
          return [
            param.name,
            z
              .string({ required_error: `${param.name} 是必填项` })
              .min(1, { message: `${param.name} 是必填项` }),
          ];
        }
        return [param.name, z.string().optional()];
      })
    ),
    requestBody: z.string().optional(),
  });

  // 默认选择第一个服务器URL或空字符串
  const defaultBaseUrl =
    servers && servers.length > 0 ? servers[0].url : "https://api.example.com";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseUrl: defaultBaseUrl,
      ...Object.fromEntries(
        parameters.map((param) => [param.name, param.default || ""])
      ),
      requestBody: requestBody
        ? JSON.stringify(getRequestBodyExample(requestBody), null, 2)
        : "",
    },
  });

  function getRequestBodyExample(body: RequestBody) {
    try {
      if (body?.content?.["application/json"]?.example) {
        return body.content["application/json"].example;
      }

      if (body?.content?.["application/json"]?.schema) {
        return {};
      }

      return {};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error generating example:", error.message);
      }
      return {};
    }
  }

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: "", value: "" }]);
  };

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateCustomHeader = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setResponseHeaders(null);
    setResponseTime(null);
    setResponseError(null);

    // 构建请求路径
    let requestPath = path;

    // 替换路径参数
    parameters
      .filter((p) => p.in === "path")
      .forEach((param) => {
        requestPath = requestPath.replace(
          `{${param.name}}`,
          values[param.name]
        );
      });

    // 构建查询参数
    const queryParams = new URLSearchParams();
    parameters
      .filter((p) => p.in === "query" && values[p.name])
      .forEach((param) => {
        queryParams.append(param.name, values[param.name]);
      });

    // 完整URL
    const queryString = queryParams.toString();
    const url = `${values.baseUrl}${requestPath}${
      queryString ? `?${queryString}` : ""
    }`;

    // 请求头
    const headers: Record<string, string> = {};
    customHeaders.forEach((header) => {
      if (header.key && header.value) {
        headers[header.key] = header.value;
      }
    });

    // 请求体
    let requestBodyData = undefined;
    if (
      ["post", "put", "patch"].includes(method.toLowerCase()) &&
      values.requestBody
    ) {
      try {
        requestBodyData = JSON.parse(values.requestBody);
      } catch {
        toast({
          title: "请求体格式错误",
          description: "无法解析JSON请求体",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const startTime = performance.now();

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: requestBodyData,
        validateStatus: () => true, // 不抛出HTTP错误
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      setResponseData(response.data);
      setResponseStatus(response.status);
      setResponseHeaders(response.headers as Record<string, string>);
      setResponseTime(duration);

      // 添加到历史记录
      addHistoryItem({
        id: uuidv4(),
        timestamp: Date.now(),
        path: requestPath,
        method: method.toUpperCase(),
        request: {
          params: Object.fromEntries(
            parameters.map((p) => [p.name, values[p.name]])
          ),
          headers,
          body: requestBodyData,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
          data: response.data,
        },
        duration,
      });
    } catch (error: unknown) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setResponseError(errorMessage);
      setResponseTime(duration);

      // 添加到历史记录
      addHistoryItem({
        id: uuidv4(),
        timestamp: Date.now(),
        path: requestPath,
        method: method.toUpperCase(),
        request: {
          params: Object.fromEntries(
            parameters.map((p) => [p.name, values[p.name]])
          ),
          headers,
          body: requestBodyData,
        },
        error: errorMessage,
        duration,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (responseData) {
      Prism.highlightAll();
    }
  }, [responseData]);

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion type="single" collapsible defaultValue="endpoint">
            <AccordionItem value="endpoint">
              <AccordionTrigger>端点信息</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>基础URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>API的基础URL</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`uppercase ${
                        method.toLowerCase() === "get"
                          ? "bg-blue-500"
                          : method.toLowerCase() === "post"
                          ? "bg-green-500"
                          : method.toLowerCase() === "put"
                          ? "bg-yellow-500"
                          : method.toLowerCase() === "delete"
                          ? "bg-red-500"
                          : "bg-purple-500"
                      }`}
                    >
                      {method}
                    </Badge>
                    <span className="font-mono text-sm">{path}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {parameters.length > 0 && (
              <AccordionItem value="parameters">
                <AccordionTrigger>参数</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {parameters.map((param) => (
                      <FormField
                        key={param.name}
                        control={form.control}
                        name={param.name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {param.name}
                              {param.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                              <Badge
                                variant="outline"
                                className="ml-2 font-normal"
                              >
                                {param.in}
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={param.description || param.name}
                              />
                            </FormControl>
                            <FormDescription>
                              {param.description}
                              {param.schema?.type &&
                                ` (类型: ${param.schema.type})`}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="headers">
              <AccordionTrigger>HTTP 请求头</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {customHeaders.map((header, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Input
                        value={header.key}
                        onChange={(e) =>
                          updateCustomHeader(index, "key", e.target.value)
                        }
                        placeholder="Header 名称"
                        className="flex-1"
                      />
                      <Input
                        value={header.value}
                        onChange={(e) =>
                          updateCustomHeader(index, "value", e.target.value)
                        }
                        placeholder="Header 值"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomHeader(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={addCustomHeader}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加请求头
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {["post", "put", "patch"].includes(method.toLowerCase()) &&
              requestBody && (
                <AccordionItem value="body">
                  <AccordionTrigger>请求体</AccordionTrigger>
                  <AccordionContent>
                    <FormField
                      control={form.control}
                      name="requestBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>请求体 (JSON)</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="font-mono h-40" />
                          </FormControl>
                          <FormDescription>
                            请提供有效的JSON请求体
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
          </Accordion>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  发送请求中...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  发送请求
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {(responseData || responseError) && (
        <div className="border rounded-lg p-4 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">响应</h3>
            <div className="flex items-center gap-2">
              {responseStatus && (
                <Badge
                  className={`${
                    responseStatus >= 200 && responseStatus < 300
                      ? "bg-green-500"
                      : responseStatus >= 300 && responseStatus < 400
                      ? "bg-blue-500"
                      : responseStatus >= 400 && responseStatus < 500
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                >
                  {responseStatus}
                </Badge>
              )}
              {responseTime && (
                <Badge variant="outline">{responseTime}ms</Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="response">
            <TabsList>
              <TabsTrigger value="response">响应</TabsTrigger>
              <TabsTrigger value="headers">响应头</TabsTrigger>
            </TabsList>
            <TabsContent value="response">
              {responseError ? (
                <div className="text-red-500 p-4 bg-red-50 rounded border border-red-200">
                  {responseError}
                </div>
              ) : (
                <div className="relative">
                  <pre className="rounded-lg">
                    <code className="language-json">
                      {JSON.stringify(responseData, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </TabsContent>
            <TabsContent value="headers">
              {responseHeaders && (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">名称</th>
                        <th className="p-2 text-left">值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(responseHeaders).map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="p-2 font-mono text-sm">{key}</td>
                          <td className="p-2 font-mono text-sm break-all">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
