import Validator, { Rules } from "validatorjs";

export function createRules(body: any): boolean | void {
    let rules: Rules = {
        name: "required",
        description: "required",
        value: "required",
        unit_ids: "required",
        is_yearly: "required"
    }
    var validation = new Validator(body, rules);

    return !validation.fails();
}