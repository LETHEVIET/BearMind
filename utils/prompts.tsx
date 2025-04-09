const makeContextPrompt = (tabs: BrowserTab[]) => {
  return `--- CONTEXT BEGIN ---
  [Paste your document or relevant sections here]
  --- CONTEXT END ---`
}

const readMarkdownPrompt = (markdown: string) => {
  const systemPrompt = `Your task is read a markdown converted from html page. 
  The markdown is not well formatted. Please remove unnecessary information keep the content of the web page for later use as context of question answering chat bot.`
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `This is the markdown content: ${markdown}`,
    },
  ]
  return messages;
}

export {readMarkdownPrompt}
