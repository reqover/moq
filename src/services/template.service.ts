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

const future_date = new TwingFunction(
  'future_date',
  (date, plus_days, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'") => {
    const oldDate = new Date(date);
    const oldDateDay = oldDate.getDate();
    oldDate.setDate(oldDateDay + plus_days);
    const result = format(oldDate, pattern);
    return Promise.resolve(result);
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
  twing.addGlobal('now', new Date());
  twing.addFunction(dateTime);
  twing.addFunction(future_date);

  const output = await twing.render('template');
  return JSON.parse(output);
}
