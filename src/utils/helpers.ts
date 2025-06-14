import { Response, Request, NextFunction } from "express";

export function handleError(res: Response, error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
}

export function validateParams(params: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        for (const param of params) {
            if (!req.params[param]) {
                res.status(400).json({ error: `Missing parameter: ${param}` });
                return;
            }
        }
        next();
    };
}

