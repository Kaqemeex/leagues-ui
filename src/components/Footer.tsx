export function Footer() {
  return (
    <footer className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
      Data sourced from the{' '}
      <a href="https://oldschool.runescape.wiki" target="_blank" rel="noreferrer" className="underline">
        OSRS Wiki
      </a>
      {' · '}
      <a href="https://github.com/Kaqemeex/leagues-ui" target="_blank" rel="noreferrer" className="underline">
        GitHub
      </a>
    </footer>
  )
}
