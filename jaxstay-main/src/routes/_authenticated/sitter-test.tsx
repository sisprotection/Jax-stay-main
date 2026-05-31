const QUESTIONS = [
  {
    q: "A dog suddenly collapses during a walk on a hot day. What should you do first?",
    options: [
      "Wait 30 minutes to see if the dog gets better",
      "Give the dog a treat and keep walking slowly",
      "Move the dog to shade/cool area, stop activity, contact owner and emergency vet",
      "Pour ice water directly over the dog and leave them alone",
    ],
  },
  {
    q: "Two dogs in your care become stiff, growling, and staring at each other. What is the safest response?",
    options: [
      "Let them work it out naturally",
      "Calmly separate them with distance/barriers and avoid putting hands between mouths",
      "Give both dogs food to distract them",
      "Yell loudly and run toward them",
    ],
  },
  {
    q: "Which food is unsafe for dogs?",
    options: ["Plain cooked rice", "Plain pumpkin", "Dog kibble", "Chocolate"],
  },
  {
    q: "An owner gives medication instructions. What should you do?",
    options: [
      "Skip the dose if the dog seems fine",
      "Adjust the dose based on your judgment",
      "Follow instructions exactly and log every dose",
      "Give extra medication if the dog looks uncomfortable",
    ],
  },
  {
    q: "During a JaxStay booking, off-leash activity in a public non-designated area is:",
    options: [
      "Never acceptable unless the owner gave written permission and the area is legally/designated off-leash",
      "Allowed if the dog is friendly",
      "Always up to the sitter",
      "Allowed if no one is nearby",
    ],
  },
  {
    q: "A dog eats a sock. What should you do?",
    options: [
      "Wait a few days to see if it passes",
      "Ignore it if the dog is acting normal",
      "Induce vomiting yourself without vet guidance",
      "Call the owner and contact a vet/emergency vet immediately",
    ],
  },
  {
    q: "Which is a good daily safety practice during a pet stay?",
    options: [
      "Let the pet roam freely in unfamiliar areas",
      "Send owner updates/photos and report concerns quickly",
      "Avoid messaging the owner unless there is an emergency",
      "Feed whatever snacks are available",
    ],
  },
  {
    q: "Common heat stroke signs include:",
    options: [
      "Cold paws only",
      "A wagging tail",
      "Heavy panting, drooling, weakness, confusion, collapse",
      "Sleeping more than usual only",
    ],
  },
  {
    q: "If a pet escapes or bolts from the door, what should you do?",
    options: [
      "Immediately secure other pets, contact the owner, search safely, and notify proper local help if needed",
      "Wait for the pet to come back on its own",
      "Post online first before contacting the owner",
      "Blame the pet and continue the booking",
    ],
  },
  {
    q: "A dog has repeated vomiting, diarrhea, or extreme lethargy. What should you do?",
    options: [
      "Wait until the booking ends",
      "Give human medicine",
      "Stop giving water",
      "Treat it as a serious concern and contact the owner/vet promptly",
    ],
  },
  {
    q: "What is the safest way to introduce two unfamiliar dogs?",
    options: [
      "Put them together in a small room immediately",
      "Use controlled distance, calm supervision, and separate if tension appears",
      "Feed them from the same bowl",
      "Let them meet while both are excited at the front door",
    ],
  },
  {
    q: "If a client says their dog is reactive to other dogs, you should:",
    options: [
      "Take the dog to a dog park to socialize",
      "Ignore the warning if the dog seems nice",
      "Avoid triggers, use secure handling, and follow the owner’s safety instructions",
      "Let strangers pet the dog freely",
    ],
  },
  {
    q: "Which item is important for transportation safety?",
    options: [
      "Secure crate, carrier, seatbelt harness, or safe containment",
      "Pet loose in the front seat",
      "Open windows fully",
      "Pet riding in driver’s lap",
    ],
  },
  {
    q: "If you transport a pet and need to stop somewhere extra, what should you do?",
    options: [
      "Take extra stops without telling the client",
      "Leave the pet in the car unattended",
      "Let the pet walk loose in a parking lot",
      "Confirm details, keep the pet secure, and follow the agreed transportation plan",
    ],
  },
  {
    q: "A pet has a known allergy listed in the intake form. You should:",
    options: [
      "Try a small amount to test it",
      "Avoid the allergen completely and follow owner instructions",
      "Ignore it if the pet begs for food",
      "Ask another client what to do",
    ],
  },
  {
    q: "What should you do before accepting a booking?",
    options: [
      "Accept every booking quickly",
      "Only look at the payment amount",
      "Review the service, dates/times, pet needs, owner notes, and whether you can safely handle it",
      "Ignore the pet details until drop-off",
    ],
  },
  {
    q: "If the pet intake says the pet is prone to bolting, you should:",
    options: [
      "Use extra door/leash safety and avoid risky openings",
      "Leave doors open for ventilation",
      "Trust the pet will stay nearby",
      "Let the pet off leash to burn energy",
    ],
  },
  {
    q: "If a client asks you to do something unsafe or illegal, you should:",
    options: [
      "Do it if they pay extra",
      "Cancel without explanation",
      "Ignore the law if the owner requested it",
      "Politely refuse, explain safety concerns, and contact JaxStay support if needed",
    ],
  },
  {
    q: "What is the correct way to handle owner keys, access codes, or private information?",
    options: [
      "Share them with friends if helpful",
      "Keep them private and only use them for the booking",
      "Post them in chat groups",
      "Save them forever for convenience",
    ],
  },
  {
    q: "If you notice a pet injury during the stay, you should:",
    options: [
      "Hide it so the owner does not worry",
      "Wait until the owner returns",
      "Document it, contact the owner, and seek vet guidance if needed",
      "Use random home remedies",
    ],
  },
  {
    q: "A dog fight starts. What should you avoid?",
    options: [
      "Putting your hands near mouths or grabbing collars during active biting",
      "Creating distance/barriers if safe",
      "Calling for help",
      "Reporting the incident",
    ],
  },
  {
    q: "A client’s pet refuses food for one meal but otherwise seems normal. What is best?",
    options: [
      "Force-feed the pet",
      "Give random human food",
      "Ignore all future meals",
      "Monitor, document, and update the owner according to instructions",
    ],
  },
  {
    q: "Which is best for preventing lost pets?",
    options: [
      "Let pets explore outside alone",
      "Open doors before leashing",
      "Secure leashes, closed doors/gates, verified collars/harnesses, and constant supervision",
      "Trust all fences without checking",
    ],
  },
  {
    q: "If a pet damages something in a client’s home, what should you do?",
    options: [
      "Hide the damage",
      "Document it honestly and notify the owner/JaxStay as appropriate",
      "Blame another pet without knowing",
      "Delete messages about it",
    ],
  },
  {
    q: "What should a sitter do if they feel overwhelmed or unsafe with a booking?",
    options: [
      "Abandon the pet",
      "Invite random friends to help without permission",
      "Ignore the issue",
      "Contact the owner and JaxStay support, and take safe steps to separate/secure pets",
    ],
  },
  {
    q: "Which is appropriate owner communication?",
    options: [
      "Clear updates, honest concerns, and quick notice about problems",
      "Only positive messages even if something is wrong",
      "No updates unless paid extra",
      "Arguing with the client",
    ],
  },
  {
    q: "If a pet requires a crate and the owner says it is part of their routine, you should:",
    options: [
      "Never use the crate under any circumstances",
      "Use the crate as punishment",
      "Follow the routine respectfully and safely",
      "Ignore the routine",
    ],
  },
  {
    q: "If a dog shows signs of bloat, such as swollen abdomen, retching, distress, or collapse, what should you do?",
    options: [
      "Wait overnight",
      "Treat it as an emergency and contact an emergency vet immediately",
      "Give a large meal",
      "Take the dog for a run",
    ],
  },
  {
    q: "Which action best represents JaxStay sitter ethics?",
    options: [
      "Accept jobs you cannot safely handle",
      "Hide problems to protect your rating",
      "Use client pets for social media without permission",
      "Prioritize pet safety, honesty, client communication, and documented care",
    ],
  },
  {
    q: "If the owner’s instructions conflict with pet safety, what should you do?",
    options: [
      "Use safe judgment, contact the owner, and escalate to JaxStay/support if needed",
      "Ignore safety because the owner asked",
      "Do whatever is fastest",
      "Let the pet decide",
    ],
  },
];