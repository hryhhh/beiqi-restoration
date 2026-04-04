import { footerContacts, footerCopyright, footerDescription, footerGroups } from './landingContent';

export default function LandingFooter() {
  return (
    <footer className="landing-footer py-12 px-6 text-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-lg mb-2" style={{ color: '#C9A66B' }}>壁蕴</div>
            <p className="text-xs leading-relaxed opacity-60">{footerDescription}</p>
          </div>

          {footerGroups.slice(0, 2).map((group) => (
            <div key={group.title}>
              <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>{group.title}</h4>
              <ul className="space-y-2 opacity-60">
                {group.items.map((item) => (
                  <li key={item} className="cursor-pointer transition-opacity hover:opacity-100">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>联系我们</h4>
            <ul className="space-y-2 opacity-60">
              {footerContacts.map((item) => (
                <li key={item.text} className="flex items-center gap-2">
                  {item.icon}
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>{footerGroups[2].title}</h4>
            <ul className="space-y-2 opacity-60">
              {footerGroups[2].items.map((item) => (
                <li key={item} className="cursor-pointer transition-opacity hover:opacity-100">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center opacity-40" style={{ borderColor: '#3F2E1E' }}>
          <p>{footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
}
