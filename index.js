const axios = require('axios');
const cheerio = require('cheerio');
const xlsx = require('xlsx');

(async () => {
    try {
        const companies = [];

        // Там было 64 страницы но мне лень было делать чтение последний страницы в пагинаций
        for (let page = 1; page <= 64; page++) {
            // ссылка
            const url = `https://damu.kz/ru/poleznaya-informatsiya/online_catalog?PAGEN_1=${page}&SIZEN_1=50`;
            // видеть в консоле какая страница щас
            console.log(`Загружаем страницу ${page}...`);
            // бла бла бла черио работает
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            // вот уже извлекаем инфу
            $('.card').each((i, card) => {
                const $card = $(card);
                // я не знаю но нужная инфа была в кнопке
                const $button = $card.find('.btn-catalog');

                // собираем инфу
                const company = {
                    name: $button.attr('data-name') || null,                // Название организаций
                    production: $button.attr('data-product') || null,       // Продукция их
                    director: $button.attr('data-seo_name') || null,        // Фио руговодителья
                    address: $button.attr('data-address') || null,          // Адресс физический
                    phone: $button.attr('data-phone') || null,              // Телефон
                    type: $button.attr('data-type') || null,                // Тип организаций
                    bin: $button.attr('data-bin') || null,                  // БИН
                    company_size: $button.attr('data-size') || null,        // Размер компаний
                };

                // Если есть инстаграмм то ложим
                const instaLink = $card.find('a[href*="instagram.com"]').attr('href');
                if (instaLink) company.instagram = instaLink;
                // Если есть сайт то тоже ложим
                const siteLink = $card.find('a[href]').filter(function () {
                    const href = $(this).attr('href');
                    return href && !href.startsWith('tel:') && !href.includes('instagram.com');
                }).first().attr('href');
                if (siteLink) company.website = siteLink;

                companies.push(company);
            });
        }

        // Название заголовков
        const headersMap = {
            name: 'Название организации',
            production: 'Продукция',
            director: 'ФИО руководителя',
            address: 'Адрес',
            phone: 'Телефон',
            type: 'Тип организации',
            bin: 'БИН',
            company_size: 'Размер компании',
            instagram: 'Instagram',
            website: 'Сайт',
        };

        // Перед созданием листа преобразуем данные:
        const formattedCompanies = companies.map(company => {
            const formatted = {};
            for (const key in company) {
                if (company[key] !== null && headersMap[key]) {
                    formatted[headersMap[key]] = company[key];
                }
            }
            return formatted;
        });

        // Создаем эксельку по доке
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(formattedCompanies);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Companies');
        xlsx.writeFile(workbook, 'companies.xlsx');

        console.log(`Готово`);

    } catch (error) {
        console.error('Ошибка:', error);
    }
})();
