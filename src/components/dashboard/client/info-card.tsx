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
      viewport={{ once: true, margin: "20px" }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.03,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full focus:outline-none"
      tabIndex={0}
    >
      <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-card/95 hover:bg-card/90 active:bg-card/85">
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
                  hidden: { opacity: 0, x: -10 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    },
                  },
                }}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                whileHover={{
                  x: 4,
                  transition: { duration: 0.15 },
                }}
                whileFocus={{
                  x: 4,
                  backgroundColor: "rgba(0, 0, 0, 0.03)",
                }}
                tabIndex={0}
                aria-label={`${item.label}: ${item.value}`}
              >
                <span className="text-muted-foreground truncate max-w-[120px]">
                  {item.label}
                </span>
                <motion.span
                  className="font-medium truncate max-w-[150px]"
                  initial={{ opacity: 0.8 }}
                  whileInView={{ opacity: 1 }}
                >
                  {item.value.toString()}
                </motion.span>
              </motion.li>
            ))}
          </motion.ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
