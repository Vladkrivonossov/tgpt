import config from 'config'
import { Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import { openai } from './openai.js'

const INITIAL_SESSION = {
	messages: [],
}

const bot = new Telegraf(config.get('TG_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
	ctx.session = INITIAL_SESSION
	await ctx.reply('new session')
})

bot.command('start', async (ctx) => {
	ctx.session = INITIAL_SESSION
	await ctx.reply('new session')
})

bot.on(message('text'), async (ctx) => {
	if (!ctx.message.text.includes('гпт')) {
		return
	}

	ctx.session ??= INITIAL_SESSION
	try {
		await ctx.reply(code('Waitin for response...'))
		const text = ctx.message.text

		await ctx.session.messages.push({ role: openai.roles.USER, content: text })

		const response = await openai.chat(ctx.session.messages)

		await ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content })

		await ctx.reply(response.content)
	} catch (e) {
		console.log(`error ${e.message}`)
	}
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
