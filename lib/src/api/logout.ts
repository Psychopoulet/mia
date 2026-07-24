// types & interfaces

    // externals
    import type { Request, Response } from "express";

// module

export default function logout (req: Request, res: Response): void {

    res.status(204).json();

}
