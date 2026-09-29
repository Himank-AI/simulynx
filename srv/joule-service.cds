service JouleService @(path: 'joule') {
  action ask(runId: String, question: String) returns LargeString;
  function suggestions() returns LargeString;
}
