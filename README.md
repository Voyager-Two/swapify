- See live demo: https://fun-xyz-demo.vercel.app

## Testing locally
- `yarn install`
- `yarn run dev` 
- Go to `http://localhost:3000`

## Foreword
- With this demo, I wanted to demonstrate my skills and capabilities in creating production-grade code and features. Hence why I use Redux and RTK Query, even though it's not really nessessary. Of course, when given a real task, I would stick more to the scope of the task and avoid overcomplication. Meaning, only utilize simplest tools to get the job done. Because the more code and libraries you introduce, the more complex the codebase becomes.
- I also deviated from specification, which asks for a price explorer, to full token swap functionality, with available balance, etc. I did this because it allowed me implement more features to demonstrate more advanced skills. Also I believe it's a more realistic feature, as Kraken, Coinbase, and DEXs have this feature. Also, as a user, I only have experience with converting tokens, rather than exploring price comparisons.

## Code architecture
- Feature code is inside `features/TokenSwap`
- Non-feature specific code is inside `common` folder
- Main interface code is inside `components/StepOne` / `SwapInterface.tsx`
- React components inside `features/TokenSwap/components`
- `index.tsx` acts as wrapper for all steps/screens
- `Review.tsx` & `Success.tsx` screens
- `tokenApi.ts` RTK query
- `swapSlice.ts` Redux state
- `common.ts` for common exports
- `moneyHelpers.ts` and `weiCalculations.ts` for monetary calc / formatting
- Most CSS is inside `css` folder

## Technical details
- Next.js & React
- React Hook Form for form state management w/ Zod for validation
- Redux for managing other state, such as which step user is on
- RTK Query for API calls, taking advantage of its built-in caching, so we don't spam the API
- Mantine as UI framework
- Do precise calculations by converting to smallest unit Wei/cents since doing math with floating decimals in JS is not accurate and error-prone
- Used Intl.NumberFormat for formatting USD amounts, but for production app can use library such as Dinero.js. But since we are dealing with Crypto, Dinero.js would not be too ideal as it's meant for fiat currency.
- Used viem library for some calculations for accuracy
- Using react-number-format library to format currency input for better UX
- Mobile/responsive optimization via media queries. Although in a production-grade app, you'd want the CSS/design to be more mobile-first.

## AI usage
- I've used AI extensively via Cursor editor. The code patterns and style is close to what I use at my current job, which is a production-grade app (although the patterns/code could be improved further). AI needs good guidance from an experienced engineer, otherwise it can use bad patterns without complaining. So in essence, AI is only good (in scale) as good as the engineer guiding it. Without good guidance and prompting, AI-generated code can become very hard to maintain and scale.
- AI allows me to move and test features faster. It has been a game changer for me and I enjoy web development a lot more while using it. This is because it reduces time wasted on mundane repetitive actions and allows me to focus more on the fun parts of coding, building, and engineering.

## Improvements that could be made
- Code could be more modular (components w/ too many lines or complexity, buttons and CSS). In a production level codebase, you'd want reusuable components for better scalability and easier maintenance.
- Right now it makes individual API calls for each token, ideally in production app we could combine this into fewer calls to avoid spamming API
- Use API data rather than hard-coding token chainId and address
- Reduce balance after transaction for more realistic demo
- Show transaction history as bonus feature
- Crypto processing fee is not accurate since this is a centralized exchange UI, it should be in USD

## Inspiration
- Kraken
- Coinbase
