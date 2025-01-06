import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

const loadTemplate = async (templateName: string) => {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
  const template = await fs.promises.readFile(templatePath, 'utf-8');
  return handlebars.compile(template);
};

export default loadTemplate;