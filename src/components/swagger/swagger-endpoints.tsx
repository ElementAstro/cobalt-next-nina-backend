import {
  useSwaggerStore,
  PathOperation,
  PathOperations,
} from "@/stores/swagger/swaggerStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface EndpointData {
  path: string;
  method: string;
  data: PathOperation;
}

interface GroupedEndpoints {
  [tag: string]: EndpointData[];
}

export default function SwaggerEndpoints() {
  const { spec, setSelectedEndpoint } = useSwaggerStore();

  if (!spec) {
    return (
      <div className="text-center py-4 text-muted-foreground">加载中...</div>
    );
  }

  // 组织路径按标签分组
  const pathsByTag = Object.entries(spec.paths).reduce(
    (acc: GroupedEndpoints, [path, methods]: [string, PathOperations]) => {
      Object.entries(methods).forEach(
        ([method, data]: [string, PathOperation]) => {
          const tags = data.tags || ["默认"];

          tags.forEach((tag: string) => {
            if (!acc[tag]) acc[tag] = [];
            acc[tag].push({ path, method, data });
          });
        }
      );
      return acc;
    },
    {}
  );

  const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-yellow-500",
    delete: "bg-red-500",
    patch: "bg-purple-500",
  };

  return (
    <Accordion type="multiple" className="w-full">
      {Object.entries(pathsByTag).map(
        ([tag, endpoints]: [string, EndpointData[]]) => (
          <AccordionItem key={tag} value={tag}>
            <AccordionTrigger>{tag}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {endpoints.map((endpoint: EndpointData, index: number) => (
                  <div
                    key={`${endpoint.path}-${endpoint.method}-${index}`}
                    className="flex items-center p-2 hover:bg-slate-100 rounded cursor-pointer"
                    onClick={() =>
                      setSelectedEndpoint(`${endpoint.path}:${endpoint.method}`)
                    }
                  >
                    <Badge
                      className={`${
                        methodColors[endpoint.method]
                      } mr-2 uppercase`}
                    >
                      {endpoint.method}
                    </Badge>
                    <span className="text-sm truncate">
                      {endpoint.data.summary || endpoint.path}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      )}
    </Accordion>
  );
}
