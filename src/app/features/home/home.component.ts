import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  protected howTab = signal<'buyers' | 'suppliers'>('buyers');

  protected buyerSteps = [
    { num: '1', title: 'Join a hub', desc: 'Find a group deal that matches your need, or create a request to signal demand.' },
    { num: '2', title: 'Pool your demand', desc: 'Others join the hub. As quantity grows, the deal gets closer to unlocking.' },
    { num: '3', title: 'Pay wholesale', desc: 'Batch fills, deal locks in. You receive the goods at the agreed wholesale price.' },
  ];

  protected supplierSteps = [
    { num: '1', title: 'Post or respond', desc: 'List a group deal with a target quantity, or browse buyer demand and place a competing offer.' },
    { num: '2', title: 'Let AI negotiate', desc: 'Set a max discount and our agent adjusts your offer to win the batch within your limits.' },
    { num: '3', title: 'Fulfill the batch', desc: 'Once enough buyers commit, the batch closes and you ship a confirmed bulk order.' },
  ];

  protected valueProps = [
    {
      title: 'Group deals',
      desc: 'Pool your order with other buyers to hit wholesale quantities no single person could reach alone.',
      iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      iconPath2: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    },
    {
      title: 'Sellers compete for you',
      desc: 'Post your demand and watch suppliers bid against each other to win your group\'s business.',
      iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      iconPath2: undefined,
    },
    {
      title: 'AI-powered negotiation',
      desc: 'Our agent negotiates discounts on your behalf within seller-set limits — better prices, hands-free.',
      iconPath: 'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7 21h10M12 21v-4',
      iconPath2: undefined,
    },
  ];
}
