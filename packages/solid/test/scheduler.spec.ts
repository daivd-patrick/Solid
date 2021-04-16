import { MessageChannel } from "worker_threads";
import { requestCallback } from "../src";
//@ts-ignore
global.MessageChannel = MessageChannel;

describe("requestCallback basics", () => {
  test("queue a task", done => {
    requestCallback(() => {
      done();
    });
  });

  test("queue a task in correct order", done => {
    let count = 0;
    requestCallback(() => {
      expect(count).toBe(2);
      done();
    });
    requestCallback(
      () => {
        count++;
        expect(count).toBe(1);
      },
      { timeout: 10 }
    );
    requestCallback(
      () => {
        count++;
        expect(count).toBe(2);
      },
      { timeout: 40 }
    );
  });
});
