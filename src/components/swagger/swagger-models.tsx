import { useSwaggerStore } from "@/stores/swagger/swaggerStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface SchemaProperty {
  type?: string;
  format?: string;
  description?: string;
  $ref?: string;
}

interface Schema {
  properties?: Record<string, SchemaProperty>;
  type?: string;
  description?: string;
}

export default function SwaggerModels() {
  const { spec } = useSwaggerStore();

  if (!spec) {
    return (
      <div className="text-center py-4 text-muted-foreground">加载中...</div>
    );
  }

  const schemas = spec.components?.schemas || {};

  if (Object.keys(schemas).length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">无模型定义</div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(schemas).map(([name, schema]: [string, Schema]) => (
        <AccordionItem key={name} value={name}>
          <AccordionTrigger>{name}</AccordionTrigger>
          <AccordionContent>
            {schema.properties ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>属性</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>格式</TableHead>
                    <TableHead>描述</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(schema.properties).map(
                    ([propName, propSchema]: [string, SchemaProperty]) => (
                      <TableRow key={propName}>
                        <TableCell>{propName}</TableCell>
                        <TableCell>
                          {propSchema.type ||
                            (propSchema.$ref ? "引用" : "未知")}
                        </TableCell>
                        <TableCell>{propSchema.format || "-"}</TableCell>
                        <TableCell>{propSchema.description || "-"}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            ) : (
              <pre className="bg-slate-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(schema, null, 2)}
              </pre>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
