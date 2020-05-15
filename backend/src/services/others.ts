import { PaymentMap } from '../models/payment_map';
import { Revenue } from '../models/revenue';
import { Expense } from '../models/expense';
import { Like, MoreThan, LessThan } from 'typeorm';

export async function monthlyData(month: Number, year: String) {
    try {
        let payment_map: PaymentMap = await PaymentMap.findOne({ where: { year, yearly: true } });
        if (!payment_map) {
            throw new Error('Não existe nenhum mapa de pagamento anual para o ano indicado');
        }

        let revenues: Revenue[] = await Revenue.find({ where: { payment_map, month } });
        if (revenues.length === 0) {
            throw new Error('Mês inválido!')
        }

        let total_paid = 0;
        let total_missing = 0;

        for (let i = 0; i < revenues.length; i++) {
            if (revenues[i].isPaid()) {
                total_paid += Number(revenues[i].getValue());
            } else {
                total_missing += Number(revenues[i].getValue());
            }
        }

        let typology_values: { name: String, value: Number }[] = []
        for (let i = 0; i < revenues.length; i++) {
            if (!existsTypologyName(typology_values, revenues[i].getUnit().getTypology().getTypology())) {
                typology_values.push({
                    name: revenues[i].getUnit().getTypology().getTypology(),
                    value: revenues[i].getValue()
                })
            }
        }

        let total_spent = 0;
        let expenses: Expense[] = await Expense.find({
            where: {
                payment_date: MoreThan(new Date(`${year}-${month}-01`)) && LessThan(new Date(`${year}-${Number(month) + 1}-01`))
            }
        });
        console.log(expenses);
        for (let i = 0; i < expenses.length; i++) {
            total_spent += Number(expenses[i].getValue())
        }

        let res = {
            total_missing,
            total_paid,
            total_spent,
            typology_values
        }

        return res;

    } catch (error) {
        return error;
    }
}

function existsTypologyName(typology_values: { name: String, value: Number }[], name: String): boolean {
    for (let i = 0; i < typology_values.length; i++) {
        if (typology_values[i].name === name) {
            return true;
        }
    }
    return false;
}