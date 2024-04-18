// Импортируем все контроллеры
import * as authController from './authController.js'
import * as customersController from './customersController.js';
import * as productsController from './productsController.js';
import * as financialSituationController from './financialSituationController.js';
import * as supplyContractsController from './supplyContractsController.js';
import * as warehousesController from "./warehousesController.js";

// Экспортируем все контроллеры в виде объекта
export {
    authController,
    customersController,
    productsController,
    financialSituationController,
    supplyContractsController,
    warehousesController
};

