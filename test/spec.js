const mocha = require("mocha");
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../src/app");
chai.use(chaiHttp);
const expect = chai.expect;
const requester = chai.request(app).keepOpen();
const Customer = require("./test-cases/customerRegister");
const CustomerTopup = require("./test-cases/customerTopup");
const chaiUtil = require("../src/utils/chai");
const { isRegisterDataFull, isValidEmail } = require("../src/utils/index");
const validCustomerData = ["id", "name", "email", "phone", "balance"];
describe("Customer", () => {
  describe("POST /customer/register", async () => {
    let url = "/customer/register";
    for (let i = 0; i < Customer.length; i++) {
      let { name, email, phone } = Customer[i];
      if (!isRegisterDataFull(name, email, phone)) {
        it("should return error if register data not full", async () => {
          let res = await chaiUtil.post(requester, url, Customer[i]);
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error", true);
          expect(res.body.message).to.have.property(
            "errorMessage",
            "Data tidak lengkap"
          );
        });
      } else if (!isValidEmail(email)) {
        it("should return error if email not valid", async () => {
          let res = await chaiUtil.post(requester, url, Customer[i]);
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error", true);
          expect(res.body.message).to.have.property(
            "errorMessage",
            "Email tidak valid"
          );
        });
      } else {
        it("should return customerId if no error", async () => {
          let res = await chaiUtil.post(requester, url, Customer[i]);
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("error", false);
        });
      }
    }
  });
  describe("GET /customer", async () => {
    it("should return all customer", async () => {
      let res = await chaiUtil.get(requester, "/customer");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("error", false);
    });
  });
  describe("GET /customer/{id}", async () => {
    it("should return customer data if no error", async () => {
      let res = await chaiUtil.get(requester, "/customer/1");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("error", false);
      expect(res.body.message[0]).to.have.all.keys(validCustomerData);
    });
    it("should return error if no customer found", async () => {
      let res = await chaiUtil.get(requester, "/customer/0");
      expect(res).to.have.status(404);
      expect(res.body).to.have.property("error", true);
      expect(res.body.message).to.have.property(
        "errorMessage",
        "Customer tidak ditemukan"
      );
    });
  });
  describe("POST /customer/topup", async () => {
      it("should increase the customer's balance", async () => {        
        let data = CustomerTopup[0];
        let beforeTopup = await chaiUtil.get(requester, `/customer/${CustomerTopup[0].customer_id}`);
        let res = await chaiUtil.post(requester, "/customer/topup", data);
        let afterTopup = await chaiUtil.get(requester, `/customer/${CustomerTopup[0].customer_id}`);
        let balanceAfterTop = afterTopup.body.message[0].balance;
        let balanceBeforeTop = beforeTopup.body.message[0].balance;
        let balanceDiff = balanceAfterTop - balanceBeforeTop;
        expect(res).to.have.status(201);
        expect(res).to.have.property("error", false);
        expect(balanceDiff).to.equal(data.amount);
      });
      it("should return error if no customer found", async () => {
        let data = CustomerTopup[1];
        let res = await chaiUtil.post(requester, "/customer/topup", data);
        expect(res).to.have.status(404);
        expect(res.body).to.have.property("error", true);
        expect(res.body.message).to.have.property(
          "errorMessage",
          "Customer tidak ditemukan"
        );
      });
  });
});
