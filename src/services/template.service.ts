import { faker } from '@faker-js/faker';
import { TwingEnvironment, TwingFunction, TwingLoaderArray } from 'twing';
import { format } from 'date-fns';

const dateTime = new TwingFunction(
  'date_time',
  (pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'") => {
    return Promise.resolve(format(new Date(), pattern));
  },
  [],
);

export async function render(template: string, requestParams: any) {
  const loader = new TwingLoaderArray({
    template: JSON.stringify(template),
  });
  const twing = new TwingEnvironment(loader);
  twing.addGlobal('faker', faker);
  twing.addGlobal('req', requestParams);
  twing.addGlobal('date', new Date());
  twing.addFunction(dateTime);

  const output = await twing.render('template');
  return JSON.parse(output);
}
