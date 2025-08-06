describe('App E2E', () => {
  it('should redirect to the dashboard and display the dashboard heading', () => {
    cy.visit('/');
    cy.get('h1').should('contain', 'Dashboard');
  });
});