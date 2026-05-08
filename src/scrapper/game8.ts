import * as cheerio from 'cheerio';
import request from '../utils/request';
import { CodeModel, ScrapperModel } from '../models/genshinCodeModel';
import logger from '../utils/logger';

export async function scrapperGame8(): Promise<ScrapperModel> {
  const scrapperModel = new ScrapperModel('https://game8.co/games/Genshin-Impact/archives/304759');

  try {
    const data = await request.getSiteData(scrapperModel.url);
    const $ = cheerio.load(data);

    const getCodesFromTable = (selector: cheerio.Cheerio, type: 'normal' | 'livestream'): CodeModel[] => {
      const codeList: CodeModel[] = [];

      // Buscamos la tabla que sigue al encabezado
      const table = $(selector).nextAll('table.a-table').first();

      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          // 1. Extraer el Código: Prioridad al input de clipboard, sino el link de Hoyoverse
          let code = $(cells[0]).find('input.a-clipboard__textInput').val()?.toString().trim();

          if (!code) {
            const hoyoverseLink = $(cells[0]).find('a[href*="gift?code="]').attr('href');
            if (hoyoverseLink) {
              code = hoyoverseLink.split('code=')[1];
            }
          }

          // 2. Extraer Recompensas: Limpiamos saltos de línea y espacios extras
          const rewards = $(cells[1])
            .text()
            .split('\n')
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .join(', ');

          if (code) {
            codeList.push({
              type,
              code,
              rewards,
              expired: false, // Por definición estas secciones son de códigos activos
            });
          }
        }
      });

      return codeList;
    };

    // hl_1: Special Program (Livestream)
    // hl_2: Active Codes (Normal)
    const livestreamCodes = getCodesFromTable($('h2#hl_1'), 'livestream');
    const normalCodes = getCodesFromTable($('h2#hl_2'), 'normal');

    scrapperModel.success = true;
    scrapperModel.codes = [...livestreamCodes, ...normalCodes];

  } catch (error: any) {
    logger.error(`Error scrapping Game8: ${error.message}`);
    scrapperModel.success = false;
  }

  return scrapperModel;
}