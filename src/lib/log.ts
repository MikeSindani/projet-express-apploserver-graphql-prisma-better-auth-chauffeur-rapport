// Helper pour forcer l'affichage des logs
const log = (...messages: any[]) => {
  const output = messages
    .map((msg) => {
      if (typeof msg === "object" && msg !== null) {
        try {
          return JSON.stringify(msg, null, 2);
        } catch {
          return "[Unserializable object]";
        }
      }
      return String(msg);
    })
    .join(" ");

  Bun.write(Bun.stdout, output + "\n");
  Bun.stdout.flush; // force l’écriture immédiate
};

export default log;