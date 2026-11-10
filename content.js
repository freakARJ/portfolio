/* Fallback content. In Phase 3 the pages read from Supabase first and use this if the database is unreachable. */
window.SITE = {
  projects: [
    { title: "Test Cases for a Login Page", kind: "Testing", tags: ["Test case design"], url: "https://github.com/freakARJ/TestCase_LoginPage" },
    { title: "API Testing with Postman", kind: "Testing", tags: ["Postman", "API"], url: "https://github.com/freakARJ/API_testing.Postman" },
    { title: "Web Automation with Selenium", kind: "Testing", tags: ["Selenium", "Automation"], url: "https://github.com/freakARJ/Automation_using_SELENIUM" },
    { title: "Rent Buddy", kind: "Academic", tags: ["ASP.NET MVC", "C#", "MS-SQL"], text: "A web app for renting vehicles in tourist zones." },
    { title: "Pick A Ride", kind: "Academic", tags: ["Java", "NetBeans", "MS-SQL"], text: "An offline desktop app that lets a vendor manage a vehicle rental service." },
    { title: "Trend On Sale", kind: "Academic", tags: ["PHP", "HTML", "CSS"], text: "An e-commerce website for selling stickers." },
    { title: "iSafePlug", kind: "Academic", tags: ["Arduino", "Sensors"], text: "A smart multiplug that protects against overcharging, water spills and gas leaks." }
  ],
  articles: [
    {
      slug: "bugs-i-missed-tunnel-vision", date: "2026-11-09",
      title: "The bugs I missed because I was looking too hard",
      summary: "I tested a feature carefully and still missed a bug. Here is why, and what I do differently now.",
      tags: ["Exploratory testing", "Lessons learned"],
      body: "I once tested an enhancement to a data grid. I worked hard on it, tested it thoroughly, and still shipped with a few bugs I had missed. It is one of the biggest lessons of my career, and I still carry it.\n\n## What happened\n\nI knew the feature well, so I tested exactly what it was supposed to do, in the order I expected people to use it. I was so focused on that path that I stopped seeing everything around it. This is **tunnel vision**, and it feels like diligence while it is happening.\n\n## What I missed\n\nAfter one particular user flow, an icon that should have appeared on one of the tabs never showed up. I had checked the tab's content and the flow itself, but I never looked at the tab's icon once the flow finished.\n\n## Why it happened\n\nI was verifying data and logic, because that is what I expected to break. I did not check *what the screen should look like* at the end of the flow. Familiarity made me assume. I tested the change, not the *impact* of the change.\n\n## What I do now\n\n1. **Test the neighbours.** List the screens, data and flows that touch the change, and test those too.\n2. **Swap perspectives.** Re-test as a first-time user, as a different role, and with messy data.\n3. **Take a break, then re-test.** A short pause shows me what I overlooked.\n4. **Write down my assumptions,** then try to break each one.\n5. **Check the whole screen after every flow.** Compare tabs, icons, labels and buttons with the expected state, not only the data.\n\n## The takeaway\n\nMissing a bug does not make you a bad tester. Not learning from it does. The goal is not to never miss anything. It is to build habits that shrink the gap with every release."
    }
  ],
  ideas: [
    {
      id: "auto-test-data-setup", date: "2026-11-09",
      title: "Automate the setup data for a fresh test environment",
      tags: ["Automation", "Test data"],
      body: "Every new test environment needs the same starting data before anyone can test. Doing it by hand is slow and easy to get wrong.\n\n- Write the setup once as a script or API collection.\n- Let anyone on the team run it with one command.\n- Keep it in version control so it stays correct."
    }
  ]
};
