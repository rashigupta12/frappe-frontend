/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Receipt {
  name: string;
  bill_number: string;
  amountaed: number;
  paid_by: string;
  paid_from: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: string;
  custom_name_of_bank?: string;
  custom_account_number?: string;
  custom_card_number?: string;
  docstatus: number; // 0 = draft, 1 = submitted
  date: string; // yyyy-mm-dd
  custom_attachments: any[];
  custom_ifscibanswift_code?: string;
  custom_account_holder_name?: string;
}

export interface Payment {
  custom_account_number: string | undefined;
  custom_account_holder_name: string | undefined;
  custom_ifscibanswift_code: string | undefined;
  creation(creation: any): string | undefined;
  modified_by: string | undefined;
  name: string;
  bill_number: string;
  amountaed: number;
  paid_by: string;
  paid_to: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: string;
  custom_name_of_bank?: string;
  custom_card_number?: string;
  docstatus: number; // 0 = draft, 1 = submitted
  date: string; // yyyy-mm-dd
  custom_attachments: any[];
}

