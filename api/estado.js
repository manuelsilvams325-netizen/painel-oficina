const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CHAVE = "oficina:estado";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const senhaCerta = process.env.PAINEL_SENHA;
  const podeEditar = !!senhaCerta && req.headers["x-senha"] === senhaCerta;

  try {
    if (req.method === "GET") {
      const items = (await redis.get(CHAVE)) || [];
      return res.status(200).json({ items, canEdit: podeEditar });
    }
    if (req.method === "PUT") {
      if (!podeEditar) return res.status(401).json({ erro: "senha" });
      const items = req.body && req.body.items;
      if (!Array.isArray(items) || items.length > 500) {
        return res.status(400).json({ erro: "dados invalidos" });
      }
      await redis.set(CHAVE, items);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ erro: "metodo" });
  } catch (e) {
    return res.status(500).json({ erro: "falha no banco" });
  }
};
