/**
 * Утилита проверки типа товара и склада
 */

const validTypes = [
    'Военные самолеты', 'Тяжелая техника', 'Оружие', 'Амуниция',
    'Боеприпасы различного калибра', 'Ракеты класса земля-воздух',
    'Ракеты класса воздух-воздух', 'Ракеты класса воздух-земля', 'Межконтинентальные ракеты'
];

const subtypes = {
    'Военные самолеты': [
        'Истребители', 'Бомбардировщики', 'Разведчики', 'Транспортные самолеты',
        'Беспилотные летательные аппараты (БПЛА)', 'Разведывательные вертолеты',
        'Ударные вертолеты', 'Патрульные самолеты', 'Специальные самолеты (например, для борьбы с беспилотниками)',
        'Учебно-тренировочные самолеты', 'Танкеры (для воздушной дозаправки)', 'Эвакуационные самолеты'
    ],
    'Тяжелая техника': [
        "Ракетные комплексы", "РСЗО", "Бронетранспортеры", "Танки", "Бронеавтомобили",
        "Самоходные артиллерийские установки", "Тяжелые гаубицы", "Тяжелые минометы",
        "Разведывательные машины", "Инженерная техника"
    ],
    'Оружие': [
        "Тактические винтовки", "Штурмовые винтовки", "Пистолеты-пулеметы",
        "Пистолеты", "Ручные пулеметы", "Снайперские и пехотные винтовки"
    ],
    'Амуниция': [
        "Бронежилеты стандартного уровня защиты", "Бронежилеты с улучшенной защитой",
        "Бронежилеты с керамическими пластинами", "Бронежилеты для общевойсковых подразделений",
        "Бронежилеты для специальных операций (ССО)", "Кевларовые бронежилеты",
        "Тканевые бронежилеты", "Летные бронежилеты для летного состава",
        "Бронежилеты для бронетехники", "Каски боевые стандартного уровня защиты",
        "Каски боевые с улучшенной защитой", "Каски боевые с интегрированными коммуникационными средствами",
        "Каски боевые для общевойсковых подразделений", "Каски боевые для специальных операций (ССО)",
        "Каски боевые для танкистов", "Каски боевые для пилотов", "Каски боевые для десантников",
        "Гранаты дымовые", "Гранаты осколочные", "Гранаты огнемётные", "Гранаты штурмовые",
        "Гранаты светозвуковые", "Гранаты противотанковые", "Гранаты реактивные",
        "Гранаты ударные", "Гранаты газовые"
    ],
    'Боеприпасы различного калибра': [
        "Патроны калибра 5,45 мм", "Патроны калибра 7,62 мм", "Патроны калибра 12,7 мм",
        "Патроны калибра 14,5 мм", "Снаряды калибра 30 мм", "Снаряды калибра 85 мм",
        "Снаряды калибра 125 мм", "Снаряды калибра 152 мм", "Снаряды калибра 203 мм",
        "Снаряды калибра 240 мм", "Снаряды калибра 300 мм"
    ],
    'Ракеты класса земля-воздух': [
        "Зенитные ракетные комплексы с головками самонаведения по радиолокационной разведке (ГСН)",
        "Зенитные ракетные комплексы с головками самонаведения по радару",
        "Зенитные ракетные комплексы с инфракрасными головками самонаведения",
        "Зенитные ракетные комплексы с лазерными головками самонаведения",
        "Переносные зенитные ракетные комплексы с радиолокационным наведением",
        "Стрелково-пушечные зенитные комплексы с головками самонаведения по радару"
    ],
    'Ракеты класса воздух-воздух': [
        "Ближнего радиуса действия с ИК наведением", "Ближнего радиуса действия с радиолокационным наведением",
        "Среднего радиуса действия с радиолокационным наведением", "Дальнего радиуса действия с радиолокационным наведением",
        "Ракеты с активной радиолокационной головкой", "Ракеты с полуактивной радиолокационной головкой",
        "Ракеты с тепловой головкой", "Ракеты с радиоволновой головкой"
    ],
    'Ракеты класса воздух-земля': [
        "Управляемые авиационные бомбы", "Противокорабельные ракеты",
        "Управляемые ракетные комплексы наземного базирования", "Ракеты с ИК наведением",
        "Ракеты с радиолокационным наведением", "Ракеты с лазерным наведением",
        "Ракеты с ТВ наведением", "Ракеты с инерциальным наведением"
    ],
    'Межконтинентальные ракеты': [
        "Баллистические ракеты с одной боеголовкой", "Баллистические ракеты с множественными боеголовками",
        "Маневрирующие баллистические ракеты", "Баллистические ракеты с ядерным зарядом",
        "Баллистические ракеты с термоядерным зарядом", "Баллистические ракеты с конвенциональными боеприпасами",
        "Баллистические ракеты с гиперзвуковыми боеголовками", "Межконтинентальные ракеты-носители космических аппаратов",
        "Баллистические ракеты с разделяющимися блоками"
    ]
};

export const isValidProductType = (productType) => {
    return validTypes.includes(productType);
};

export const isValidProductSubtype = (productType, productSubtype) => {
    if (!subtypes[productType]) {
        return false;
    }
    return subtypes[productType].includes(productSubtype);
};