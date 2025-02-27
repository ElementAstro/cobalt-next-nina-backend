import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";

interface Parameter {
  in: string;
  name: string;
  example?: string | number | boolean;
  type: string;
}

interface Schema {
  type: string;
  properties?: Record<string, SchemaProperty>;
  example?: unknown;
}

interface SchemaProperty {
  type: string;
  example?: unknown;
}

interface RequestBody {
  content?: {
    "application/json"?: {
      schema: Schema;
    };
  };
}

interface CodeExamplesProps {
  path: string;
  method: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, unknown>;
}

export default function CodeExamples({
  path,
  method,
  parameters,
  requestBody,
}: CodeExamplesProps) {
  const [language, setLanguage] = useState("curl");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 当代码或语言改变时重新高亮
  useEffect(() => {
    Prism.highlightAll();
  }, [language]);

  const generateCode = () => {
    // Generate example URL with parameters
    const baseUrl = `https://api.example.com${path}`;

    // Handle query parameters
    const queryParams = parameters
      .filter((p) => p.in === "query")
      .map(
        (p) =>
          `${p.name}=${encodeURIComponent(
            String(p.example || getDefaultValueForType(p.type))
          )}`
      )
      .join("&");

    const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

    // Handle request body
    let requestBodyExample: Record<string, unknown> = {};
    if (requestBody?.content?.["application/json"]?.schema) {
      const schema = requestBody.content["application/json"].schema;
      try {
        requestBodyExample = generateExampleFromSchema(schema) as Record<
          string,
          unknown
        >;
      } catch (error) {
        console.error("Error generating request body example:", error);
        requestBodyExample = {};
      }
    }

    // Path parameters replacement
    const pathParams = parameters.filter((p) => p.in === "path");
    let finalUrl = url;
    pathParams.forEach((param) => {
      finalUrl = finalUrl.replace(
        `{${param.name}}`,
        String(param.example || getDefaultValueForType(param.type))
      );
    });

    // Generate code based on selected language
    try {
      switch (language) {
        case "curl":
          return generateCurlExample(finalUrl, method, requestBodyExample);
        case "javascript":
          return generateJavaScriptExample(
            finalUrl,
            method,
            requestBodyExample
          );
        case "python":
          return generatePythonExample(finalUrl, method, requestBodyExample);
        case "java":
          return generateJavaExample(finalUrl, method, requestBodyExample);
        default:
          return "// Language not supported yet";
      }
    } catch (error) {
      console.error("Error generating code:", error);
      return "// Error generating code example";
    }
  };

  const generateExampleFromSchema = (schema: Schema) => {
    if (schema.example) return schema.example;

    if (schema.type === "object" && schema.properties) {
      const result: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        result[key] = prop.example || getDefaultValueForType(prop.type);
      }
      return result;
    }

    return getDefaultValueForType(schema.type);
  };

  const getDefaultValueForType = (type: string): unknown => {
    switch (type) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return 0;
      case "boolean":
        return false;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return null;
    }
  };

  const generateCurlExample = (
    url: string,
    method: string,
    body: Record<string, unknown>
  ) => {
    let curl = `curl -X ${method.toUpperCase()} "${url}"`;

    // 添加请求头
    curl += ' \\\n  -H "Content-Type: application/json"';
    curl += ' \\\n  -H "Authorization: Bearer YOUR_TOKEN"';

    // 添加请求体
    if (
      ["post", "put", "patch"].includes(method.toLowerCase()) &&
      Object.keys(body).length > 0
    ) {
      curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    }

    return curl;
  };

  const generateJavaScriptExample = (
    url: string,
    method: string,
    body: Record<string, unknown>
  ) => {
    const hasBody =
      ["post", "put", "patch"].includes(method.toLowerCase()) &&
      Object.keys(body).length > 0;

    return `// 使用 Fetch API
fetch("${url}", {
  method: "${method.toUpperCase()}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  }${
    hasBody
      ? `,
  body: JSON.stringify(${JSON.stringify(body, null, 2)})`
      : ""
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))

// 使用 Axios
axios({
  method: "${method.toLowerCase()}",
  url: "${url}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  }${
    hasBody
      ? `,
  data: ${JSON.stringify(body, null, 2)}`
      : ""
  }
})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error))`;
  };

  const generatePythonExample = (
    url: string,
    method: string,
    body: Record<string, unknown>
  ) => {
    const hasBody =
      ["post", "put", "patch"].includes(method.toLowerCase()) &&
      Object.keys(body).length > 0;

    return `import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
}
${
  hasBody
    ? `payload = ${JSON.stringify(body, null, 4)}

response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)`
    : `response = requests.${method.toLowerCase()}(url, headers=headers)`
}
print(response.json())`;
  };

  const generateJavaExample = (
    url: string,
    method: string,
    body: Record<string, unknown>
  ) => {
    const hasBody =
      ["post", "put", "patch"].includes(method.toLowerCase()) &&
      Object.keys(body).length > 0;

    return `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class ApiExample {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        ${
          hasBody
            ? `String requestBody = "${JSON.stringify(body).replace(
                /"/g,
                '\\"'
              )}";
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer YOUR_TOKEN")
            .${method.toLowerCase()}(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();`
            : `HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${url}"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer YOUR_TOKEN")
            .${method.toLowerCase()}(HttpRequest.BodyPublishers.noBody())
            .build();`
        }
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        System.out.println(response.body());
    }
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCode()).then(() => {
      setCopied(true);
      toast({
        title: "已复制代码",
        description: "代码示例已复制到剪贴板",
      });

      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="curl">cURL</SelectItem>
            <SelectItem value="javascript">JavaScript (Fetch/Axios)</SelectItem>
            <SelectItem value="python">Python (Requests)</SelectItem>
            <SelectItem value="java">Java (HttpClient)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          {copied ? "已复制" : "复制代码"}
        </Button>
      </div>

      <div className="relative">
        <pre className="rounded-lg">
          <code
            className={`language-${language === "curl" ? "bash" : language}`}
          >
            {generateCode()}
          </code>
        </pre>
      </div>
    </div>
  );
}
