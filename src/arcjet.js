import arcjet, {
  shield,
  detectBot,
  tokenBucket,
  slidingWindow,
} from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE;

export const httpArcject = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
        tokenBucket({
          mode: arcjetMode,
          refillRate: 5,
          interval: 10,
          capacity: 10,
        }),
      ],
    })
  : null;

export const wsArcject = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
        tokenBucket({
          mode: arcjetMode,
          refillRate: 5,
          interval: 10,
          capacity: 10,
        }),
      ],
    })
  : null;

export function securityMiddleware(){
    return async(req, res, next)=>{
        if(!httpArcject) return next()
        try {
            const decision = await httpArcject.protect(req)
            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                  return res.status(429).json({error:"Too many requests"})
                }
                return res.status(403).json({error:"Forbidden"})
            }
        } catch (error) {
            console.error("\n\nArcjet error : ", error)
            return res.status(503).json({error:"Arcjet service unavailable"})
        }

        return next()
    }
}