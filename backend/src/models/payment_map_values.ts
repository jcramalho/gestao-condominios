import { BaseEntity, PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { PaymentMap } from './payment_map';

@Entity('PaymentMapValues')
export class PaymentMapValues extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    private id: Number;

    @Column({ name: 'value' })
    private value: String;

    @Column({ name: 'start_date' })
    private start_date: Date;

    @Column({ name: 'end_date' })
    private end_date: Date;

    @Column({ name: 'reserve_fund' })
    private reserve_fund: String;

    constructor() {
        super();
    }

    public getId(): Number {
        return this.id;
    }

    public setId(id: Number): void {
        this.id = id;
    }

    public getValue(): String {
        return this.value;
    }

    public setValue(value: String): void {
        this.value = value;
    }

    public getStart_date(): Date {
        return this.start_date;
    }

    public setStart_date(start_date: Date): void {
        this.start_date = start_date;
    }

    public getEnd_date(): Date {
        return this.end_date;
    }

    public setEnd_date(end_date: Date): void {
        this.end_date = end_date;
    }

    public getReserve_fund(): String {
        return this.reserve_fund;
    }

    public setReserve_fund(reserve_fund: String): void {
        this.reserve_fund = reserve_fund;
    }
}
