import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface InfoCardProps {
  title: string;
  items: { label: string; value: string | number | boolean }[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function InfoCard({ title, items, icon: Icon }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-card/95">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {Icon && <Icon className="w-5 h-5 text-primary" />}
            </motion.div>
            <span className="text-base font-semibold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              {title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <motion.ul
            className="space-y-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {items.map((item, index) => (
              <motion.li
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value.toString()}</span>
              </motion.li>
            ))}
          </motion.ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
