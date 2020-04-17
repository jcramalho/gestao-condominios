import { Request, Response } from 'express';
import * as supplierService from '../services/supplier';
import { ApiResponse } from '../api/api_response';
import HttpStatus from "http-status-codes";
import { Supplier } from '../models/supplier';
import * as supplierRules from '../rules/supplier';

export async function create(req: Request, res: Response) {

    if (!supplierRules.createRules(req.body))
        return res.send(new ApiResponse("Create Supplier", "Invalid Body", HttpStatus.BAD_REQUEST, {}));

    let supplier: Supplier = await supplierService.create(req.body);

    return res.send(supplier);

    //return res.send(new ApiResponse("All roles", "Success", HttpStatus.OK, roles));
    //return res.status(HttpStatus.BAD_REQUEST).send(new ApiResponse("All roles", "Request Failed", HttpStatus.BAD_REQUEST, []));
}


export async function show(req: Request, res: Response) {

    let supplier: Supplier = await supplierService.show(Number(req.params.id));

    return res.send(supplier);

    //return res.send(new ApiResponse("All roles", "Success", HttpStatus.OK, roles));
    //return res.status(HttpStatus.BAD_REQUEST).send(new ApiResponse("All roles", "Request Failed", HttpStatus.BAD_REQUEST, []));
}