import {
  Parameter,
  PathOperation,
  useSwaggerStore,
  Response,
  PathOperations,
} from "@/stores/swagger/swaggerStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SwaggerEndpointDetail() {
  const { spec, selectedEndpoint } = useSwaggerStore();

  if (!selectedEndpoint || !spec) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        请选择一个接口查看详情
      </div>
    );
  }

  const [path, method] = selectedEndpoint.split(":");
  const endpointData = spec.paths[path]?.[
    method.toLowerCase() as keyof PathOperations
  ] as PathOperation;

  if (!endpointData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        接口数据不存在
      </div>
    );
  }

  const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-yellow-500",
    delete: "bg-red-500",
    patch: "bg-purple-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge className={`${methodColors[method]} uppercase`}>
            {method}
          </Badge>
          <CardTitle>{path}</CardTitle>
        </div>
        <CardDescription>{endpointData.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="params">
          <TabsList>
            <TabsTrigger value="params">参数</TabsTrigger>
            <TabsTrigger value="responses">响应</TabsTrigger>
          </TabsList>

          <TabsContent value="params">
            {endpointData.parameters && endpointData.parameters.length > 0 ? (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">名称</th>
                      <th className="p-2 text-left">位置</th>
                      <th className="p-2 text-left">类型</th>
                      <th className="p-2 text-left">必填</th>
                      <th className="p-2 text-left">描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpointData.parameters.map(
                      (param: Parameter, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{param.name}</td>
                          <td className="p-2">{param.in}</td>
                          <td className="p-2">
                            {param.schema?.type || "未知"}
                          </td>
                          <td className="p-2">
                            {param.required ? "是" : "否"}
                          </td>
                          <td className="p-2">{param.description || "-"}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                无参数
              </div>
            )}
          </TabsContent>

          <TabsContent value="responses">
            {endpointData.responses &&
            Object.keys(endpointData.responses).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(endpointData.responses).map(
                  ([code, response]: [string, Response]) => (
                    <div key={code} className="border p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={
                            code.startsWith("2")
                              ? "bg-green-500"
                              : "bg-orange-500"
                          }
                        >
                          {code}
                        </Badge>
                        <h4 className="font-medium">{response.description}</h4>
                      </div>
                      {response.content && (
                        <pre className="bg-slate-100 p-2 rounded text-sm overflow-auto max-h-64">
                          {JSON.stringify(response.content, null, 2)}
                        </pre>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                无响应定义
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
