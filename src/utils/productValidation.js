// Утилита проверки типа товара и склада

import { subtypes, validTypes } from "../globalTypes.js";

export const isValidProductType = (productType) => {
    return validTypes.includes(productType);
};

export const isValidProductSubtype = (productType, productSubtype) => {
    if (!subtypes[productType]) {
        return false;
    }
    return subtypes[productType].includes(productSubtype);
};