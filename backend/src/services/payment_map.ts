import { PaymentMap } from '../models/payment_map';
import { PaymentMapValues } from '../models/payment_map_values';
import { Unit } from '../models/unit';
import { Revenue } from '../models/revenue';
import { MoreThan } from 'typeorm';

const months = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12
]

export async function index() { }
export async function show(id: Number) { }

/* CREATE REVENUES NORMAL PAYMENT MAP */
async function createNormalPaymentMap(units: Unit[], total_value: Number, payment_map: PaymentMap): Promise<Boolean> {
    try {
        let sum_permilage = 0;
        for (let i = 0; i < units.length; i++) {
            sum_permilage += Number(units[i].getTypology().getPermilage());
        }

        for (let i = 0; i < units.length; i++) {
            let value: Number;
            value = Number(units[i].getTypology().getPermilage().toString()) / sum_permilage;
            value = Number(value) * Number(total_value);
            let revenue: Revenue = new Revenue(0, payment_map, units[i], Number(value.toFixed(2)), false);
            await revenue.save();
        }

        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
}

async function createPaymentMap(units_month: Unit[], total_value: Number, payment_map: PaymentMap): Promise<Boolean> {
    try {

        let reserve_funds: { id, reserve_fund }[] = [];
        let monthly_expenses: { id, monthy_expense }[] = [];

        //Calculate total permilage per month
        let total_permilage_month: number = calculateTotalPermilages(units_month);

        //Calculate total permilage
        let all_units: Unit[] = await Unit.find();
        let total_permilage: number = calculateTotalPermilages(all_units);

        //Calculate monthly expenses
        monthly_expenses = calculateMonthlyExpenses(units_month, total_permilage_month, Number(total_value));

        //Calculate reserve funds
        reserve_funds = calculateReserveFunds(all_units, total_permilage, Number(total_value));

        //Save
        await saveMap(reserve_funds, monthly_expenses, payment_map, all_units);

        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
}

async function updatePaymentMap(revenues: Revenue[], total_value: Number, units_monthly: Unit[]): Promise<Boolean> {
    try {

        let reserve_funds: { id, reserve_fund }[] = [];
        let monthly_expenses: { id, monthy_expense }[] = [];

        let all_units: Unit[] = await Unit.find();
        let total_permilage: number = calculateTotalPermilages(all_units);

        let total_permilage_month: number = calculateTotalPermilages(units_monthly);

        //Calculate monthly expenses
        monthly_expenses = calculateMonthlyExpenses(units_monthly, total_permilage_month, Number(total_value));

        //Calculate reserve funds
        reserve_funds = calculateReserveFunds(all_units, total_permilage, Number(total_value));

        await updateRevenues(revenues, monthly_expenses, reserve_funds);

        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function create(body: any) {
    try {
        let current_date: Date = new Date();
        let yearly: Boolean = false;

        if (body.is_yearly == true) {
            let hasPaymentMap: PaymentMap[] = await PaymentMap.find({ where: { yearly: body.is_yearly, year: current_date.getFullYear().toString() } });
            if (hasPaymentMap.length >= 1) {
                throw new Error('Já existe um mapa anual criado para o corrente ano');
            }
            yearly = true;
        }

        let units: Unit[] = await Unit.findByIds(body.unit_ids);
        if (units.length === 0) {
            throw new Error('Não existem apartamentos com esses ids.')
        }

        let payment_map: PaymentMap = new PaymentMap(body.name, body.description, yearly, current_date.getFullYear().toString());
        await payment_map.save();


        if (yearly) {
            let payment_map_values: PaymentMapValues = new PaymentMapValues(body.value, new Date(new Date().getFullYear() + "-01"), payment_map, body.value * 0.10);
            await payment_map_values.save();
            await createPaymentMap(units, body.value, payment_map);
        } else {
            let payment_map_values: PaymentMapValues = new PaymentMapValues(body.value, new Date(), payment_map, 0);
            await payment_map_values.save();
            await createNormalPaymentMap(units, body.value, payment_map);
        }

        return true;

    } catch (error) {
        console.log(error);
        return error;
    }
}

export async function update(id: Number, body: any) {
    try {
        let payment_map: PaymentMap = await PaymentMap.findOne({ where: { id } });
        if (!payment_map) {
            throw new Error('Não existe nenhum Mapa de Pagamento com esse id');
        }

        if (body.month <= 2 && body.month >= 12) {
            throw new Error('O valor do mês não está correto, deve ser um valor entre 2 e 12');
        }

        let payment_map_values: PaymentMapValues[] = await PaymentMapValues.find({ where: { payment_map, end_date: null } });
        let month = body.month - 1;
        payment_map_values[0].setEnd_date(new Date(new Date().getFullYear() + "-" + month));
        await payment_map_values[0].save();

        let date = new Date(new Date().getFullYear() + '-' + body.month);
        let new_payment_map_value = new PaymentMapValues(body.value, date, payment_map, 0);
        await new_payment_map_value.save();

        let revenues: Revenue[] = await Revenue.find({ where: { payment_map: payment_map, month: MoreThan(month) } });

        let units_monthly: Unit[] = [];
        for (let i = 0; i < revenues.length; i++) {
            const unit: Unit = revenues[i].getUnits();
            if (revenues[i].isMonthly() === true) {
                if (!findUnit(units_monthly, unit)) {
                    units_monthly.push(unit);
                }
            }
        }
        await updatePaymentMap(revenues, body.value, units_monthly);
        return true;

    } catch (error) {
        console.log(error);
        return error;
    }
}

function findUnit(units: Unit[], unit: Unit) {
    for (let i = 0; i < units.length; i++) {
        const element = units[i];
        if (element.getId() === unit.getId()) {
            return true;
        }
    }
    return false;
}

function calculateTotalPermilages(units: Unit[]): number {
    let total_permilage_month: number = 0;
    for (let i = 0; i < units.length; i++) {
        total_permilage_month += Number(units[i].getTypology().getPermilage());
    }
    return total_permilage_month
}

function calculateMonthlyExpenses(units: Unit[], total_permilage_month: number, total_value: number): { id, monthy_expense }[] {
    let monthly_expenses: { id, monthy_expense }[] = [];
    for (let i = 0; i < units.length; i++) {
        let monthly_expense = 0;
        monthly_expense = Number(units[i].getTypology().getPermilage()) / total_permilage_month;
        monthly_expense = monthly_expense * (Number(total_value) / 12);
        monthly_expenses.push({
            id: units[i].getId(), monthy_expense: Number(monthly_expense.toFixed(2))
        });
    }
    return monthly_expenses;
}

function calculateReserveFunds(units: Unit[], total_permilage: number, total_value: number): { id, reserve_fund }[] {
    let reserve_funds: { id, reserve_fund }[] = [];
    for (let i = 0; i < units.length; i++) {
        let reserve_fund = 0;
        reserve_fund = Number(units[i].getTypology().getPermilage()) / total_permilage;
        reserve_fund = reserve_fund * ((Number(total_value) * 0.10) / 12);
        reserve_funds.push({ id: units[i].getId(), reserve_fund: Number(reserve_fund.toFixed(2)) });
    }
    return reserve_funds;
}

async function saveMap(reserve_funds: { id, reserve_fund }[], monthly_expenses: { id, monthy_expense }[], payment_map: PaymentMap, units: Unit[]) {
    for (let i = 0; i < reserve_funds.length; i++) {
        let monthly_expense = 0;
        let monthly = false;
        for (let k = 0; k < monthly_expenses.length; k++) {
            if (reserve_funds[i].id == monthly_expenses[k].id) {
                monthly_expense = monthly_expenses[k].monthy_expense;
                monthly = true;
            }
        }
        for (let j = 0; j < months.length; j++) {
            let value: Number = reserve_funds[i].reserve_fund + monthly_expense;
            let revenue: Revenue = new Revenue(months[j], payment_map, units[i], Number(value.toFixed(2)), monthly);
            await revenue.save();
        }
    }
}

async function updateRevenues(revenues: Revenue[], monthly_expenses: { id, monthy_expense }[], reserve_funds: { id, reserve_fund }[]) {
    for (let i = 0; i < revenues.length; i++) {
        const revenue = revenues[i];
    }

    for (let i = 0; i < reserve_funds.length; i++) {
        let monthly_expense = 0;
        for (let k = 0; k < monthly_expenses.length; k++) {
            if (reserve_funds[i].id == monthly_expenses[k].id) {
                monthly_expense = monthly_expenses[k].monthy_expense;
            }
        }
        for (let j = 0; j < revenues.length; j++) {
            const revenue = revenues[j];
            if (revenue.getUnits().getId() == reserve_funds[i].id) {
                console.log('aqui');
                revenue.setValue(Number(reserve_funds[i].reserve_fund + monthly_expense))
                await revenue.save();
            }
        }
    }
}